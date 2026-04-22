import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { QRCodeSVG } from 'qrcode.react';
import type {
  RoomJoinResult,
  RoomState,
} from '../services/firebaseRooms';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type TopicCategory =
  | 'entertainment'
  | 'sports'
  | 'general_knowledge'
  | 'science'
  | 'history'
  | 'custom';

export type FriendLobbyConfig = {
  topic: string;
  questionCount: number;
  difficulty: Difficulty;
};

type Props = {
  onBack: () => void;
  onOpenGame: (roomCode: string, localPlayerId: string) => void;
  onStartGame: (input: {
    room: RoomState;
    localPlayerId: string;
    config: FriendLobbyConfig;
  }) => Promise<void>;
  profileName: string;
  profileUid: string;
};

const MAX_PLAYERS = 5;
const QUESTION_OPTIONS = [5, 10, 15];
const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const TOPIC_OPTIONS: Array<{
  key: TopicCategory;
  label: string;
  topic: string;
}> = [
  {
    key: 'entertainment',
    label: 'Entertainment',
    topic: 'Entertainment, movies, music, TV shows, celebrities, pop culture',
  },
  {
    key: 'sports',
    label: 'Sports',
    topic: 'Sports, football, basketball, Olympics, athletes, competitions',
  },
  {
    key: 'general_knowledge',
    label: 'General knowledge',
    topic: 'General knowledge, trivia, world facts, geography, culture',
  },
  {
    key: 'science',
    label: 'Science',
    topic: 'Science, physics, chemistry, biology, space, technology',
  },
  {
    key: 'history',
    label: 'History',
    topic: 'History, world wars, ancient civilizations, historical events, leaders',
  },
  {
    key: 'custom',
    label: 'Custom',
    topic: '',
  },
];

type RoomServiceModule = {
  createRoom: (
    hostName: string,
    roomName?: string,
    authUid?: string,
  ) => Promise<RoomJoinResult>;
  subscribeToRoom: (
    roomCodeInput: string,
    onChange: (room: RoomState) => void,
    onError: (error: Error) => void,
  ) => () => void;
};

const resolveRoomService = async (): Promise<RoomServiceModule> => {
  const module = await import('../services/firebaseRooms');
  const candidate = ((module as { default?: unknown }).default ?? module) as Partial<RoomServiceModule>;

  if (typeof candidate.createRoom !== 'function' || typeof candidate.subscribeToRoom !== 'function') {
    throw new Error('ROOM_SERVICE_UNAVAILABLE');
  }

  return candidate as RoomServiceModule;
};

const getCreateRoomErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Unable to create room right now. Please try again.';
  }

  const normalizedMessage = error.message.toLowerCase();

  switch (error.message) {
    case 'ROOM_CODE_GENERATION_FAILED':
      return 'Unable to reserve a room code right now. Please try again.';
    case 'ROOM_SERVICE_UNAVAILABLE':
      return 'Room service failed to initialize. Please refresh the app.';
    default:
      if (
        normalizedMessage.includes('permission_denied') ||
        normalizedMessage.includes('permission denied')
      ) {
        return 'Realtime Database denied room creation. Please update your RTDB rules in Firebase Console.';
      }
      return `Unable to create room right now: ${error.message}`;
  }
};

const getStartGameErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Unable to start the game right now.';
  }

  const normalizedMessage = error.message.toLowerCase();

  switch (error.message) {
    case 'MISSING_QUESTIONS':
      return 'The quiz generator returned no questions. Please try again.';
    case 'NOT_ENOUGH_PLAYERS':
      return 'At least 2 players are needed before starting.';
    case 'NOT_HOST':
      return 'Only the host can start the game.';
    case 'ROOM_ALREADY_STARTED':
      return 'This room already started.';
    default:
      if (
        normalizedMessage.includes('permission_denied') ||
        normalizedMessage.includes('permission denied')
      ) {
        return 'Realtime Database denied the game start. Please update your RTDB rules in Firebase Console.';
      }
      return `Unable to start the game right now: ${error.message}`;
  }
};

export default function CreateRoomScreen({
  onBack,
  onOpenGame,
  onStartGame,
  profileName,
  profileUid,
}: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('myfriend');
  const [selectedTopicCategory, setSelectedTopicCategory] =
    useState<TopicCategory>('general_knowledge');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTopicSheet, setShowTopicSheet] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const openedGameRef = useRef(false);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!room || !localPlayerId || openedGameRef.current) {
      return;
    }

    if (room.status === 'in_game' || room.status === 'completed') {
      openedGameRef.current = true;
      onOpenGame(room.code, localPlayerId);
    }
  }, [localPlayerId, onOpenGame, room]);

  const handleCreateRoom = async () => {
    const trimmedName = roomNameInput.trim();
    if (!trimmedName) {
      setError('Please enter a room name first.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const roomService = await resolveRoomService();
      const createdRoom = await roomService.createRoom(profileName, trimmedName, profileUid);
      setRoom(createdRoom);
      setLocalPlayerId(createdRoom.localPlayerId);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = roomService.subscribeToRoom(
        createdRoom.code,
        updatedRoom => {
          setRoom(updatedRoom);
          setError('');
        },
        snapshotError => {
          setError(`Live updates unavailable: ${snapshotError.message}`);
        },
      );
    } catch (createError) {
      setError(getCreateRoomErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  const handleStart = async () => {
    if (!room || !localPlayerId) {
      return;
    }

    const selectedTopicOption =
      TOPIC_OPTIONS.find(option => option.key === selectedTopicCategory)
      ?? TOPIC_OPTIONS[0];
    const topic =
      selectedTopicCategory === 'custom'
        ? customTopicInput.trim()
        : selectedTopicOption.topic;
    if (!topic) {
      setError('Please enter a quiz topic before starting.');
      return;
    }

    setIsStarting(true);
    setError('');

    try {
      await onStartGame({
        room,
        localPlayerId,
        config: {
          topic,
          questionCount,
          difficulty,
        },
      });
    } catch (startError) {
      setError(getStartGameErrorMessage(startError));
    } finally {
      setIsStarting(false);
    }
  };

  const players = room?.players ?? [];
  const playerCount = players.length;
  const roomName = room?.roomName ?? (roomNameInput.trim() || 'myfriend');
  const roomCode = room?.code ?? '------';
  const selectedTopicOption = useMemo(
    () =>
      TOPIC_OPTIONS.find(option => option.key === selectedTopicCategory)
      ?? TOPIC_OPTIONS[0],
    [selectedTopicCategory],
  );
  const canStart =
    !!room
    && playerCount >= 2
    && !!(
      selectedTopicCategory === 'custom'
        ? customTopicInput.trim()
        : selectedTopicOption.topic.trim()
    )
    && !isStarting;
  const localPlayer = useMemo(
    () => players.find(player => player.id === localPlayerId) ?? null,
    [localPlayerId, players],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, room ? styles.scrollContentWithFooter : null]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Create Room</Text>
        <Text style={styles.subtitle}>
          {room ? 'Invite friends, choose the quiz setup, then launch the match' : 'Set a lobby name and create your friend room'}
        </Text>

        {!room ? (
          <View style={styles.setupCard}>
            <Text style={styles.sectionLabel}>ROOM NAME</Text>
            <TextInput
              value={roomNameInput}
              onChangeText={text => {
                setRoomNameInput(text);
                if (error) {
                  setError('');
                }
              }}
              placeholder="myfriend"
              placeholderTextColor="#A1A1A1"
              style={styles.roomNameInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={handleCreateRoom}
              disabled={isCreating}
              style={({ pressed }) => [
                styles.primaryButton,
                { opacity: pressed ? 0.9 : 1 },
                isCreating && styles.buttonDisabled,
              ]}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Room</Text>
              )}
            </Pressable>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        ) : (
          <>
            <View style={styles.inviteHubCard}>
              <Text style={styles.lobbyLabel}>Lobby: {roomName}</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{roomCode}</Text>
                <Pressable style={styles.qrIconButton} onPress={() => setShowQrModal(true)}>
                  <Text style={styles.qrIconText}>QR</Text>
                </Pressable>
              </View>
              <Text style={styles.inviteHint}>Max 5 players. Everyone will see the same timer and reveal phase.</Text>
            </View>

            <View style={styles.playerLoungeCard}>
              <Text style={styles.playerHeader}>Players ({playerCount}/{MAX_PLAYERS})</Text>
              <View style={styles.playerGrid}>
                {Array.from({ length: MAX_PLAYERS }).map((_, index) => {
                  const player = players[index];
                  if (player) {
                    const isLocal = player.id === localPlayerId;
                    return (
                      <View key={player.id} style={styles.playerSlot}>
                        <View style={[styles.playerAvatarFilled, { backgroundColor: player.color }]}>
                          <Text style={styles.playerAvatarText}>{player.name.slice(0, 1).toUpperCase()}</Text>
                          {player.isHost ? <Text style={styles.hostCrown}>👑</Text> : null}
                        </View>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {player.name}
                        </Text>
                        <Text style={styles.playerMeta}>{isLocal ? 'You' : player.color}</Text>
                      </View>
                    );
                  }

                  return (
                    <View key={`empty-${index}`} style={styles.playerSlot}>
                      <View style={styles.playerAvatarEmpty}>
                        <Text style={styles.emptySlotText}>+</Text>
                      </View>
                      <Text style={styles.emptySlotLabel}>Open</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.configCard}>
              <View style={styles.configHeaderRow}>
                <Text style={styles.configTitle}>Quiz Setup</Text>
                <Text style={styles.configHint}>
                  {localPlayer?.isHost ? 'Host controls the quiz' : 'Waiting for host setup'}
                </Text>
              </View>

              <Text style={styles.sectionLabel}>TOPIC</Text>
              <Pressable
                onPress={() => {
                  if (!localPlayer?.isHost) {
                    return;
                  }
                  setShowTopicSheet(true);
                }}
                style={[
                  styles.topicSelector,
                  !localPlayer?.isHost && styles.topicSelectorDisabled,
                ]}
              >
                <Text style={styles.topicSelectorText}>
                  {selectedTopicOption.label}
                </Text>
                <Text style={styles.topicSelectorChevron}>▼</Text>
              </Pressable>

              {selectedTopicCategory === 'custom' ? (
                <TextInput
                  value={customTopicInput}
                  onChangeText={text => {
                    setCustomTopicInput(text);
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="Type your custom topic"
                  placeholderTextColor="#A1A1A1"
                  editable={!!localPlayer?.isHost}
                  style={[
                    styles.customTopicInput,
                    !localPlayer?.isHost && styles.topicSelectorDisabled,
                  ]}
                />
              ) : null}

              <Text style={styles.sectionLabel}>QUESTION COUNT</Text>
              <View style={styles.choiceRow}>
                {QUESTION_OPTIONS.map(option => (
                  <Pressable
                    key={option}
                    disabled={!localPlayer?.isHost}
                    onPress={() => setQuestionCount(option)}
                    style={[
                      styles.choiceChip,
                      questionCount === option && styles.choiceChipActive,
                      !localPlayer?.isHost && styles.choiceChipDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        questionCount === option && styles.choiceChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionLabel}>DIFFICULTY</Text>
              <View style={styles.choiceRow}>
                {DIFFICULTIES.map(option => (
                  <Pressable
                    key={option}
                    disabled={!localPlayer?.isHost}
                    onPress={() => setDifficulty(option)}
                    style={[
                      styles.choiceChip,
                      difficulty === option && styles.choiceChipActive,
                      !localPlayer?.isHost && styles.choiceChipDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        difficulty === option && styles.choiceChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
      </ScrollView>

      {room ? (
        <View style={styles.footerBar}>
          <Pressable
            style={[
              styles.startButton,
              (!canStart || !localPlayer?.isHost) && styles.buttonDisabled,
            ]}
            disabled={!canStart || !localPlayer?.isHost}
            onPress={handleStart}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>START FRIEND GAME</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <Modal visible={showQrModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowQrModal(false)}>
          <Pressable style={styles.qrModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Invite QR</Text>
            <View style={styles.qrCanvas}>
              <QRCodeSVG value={roomCode} size={170} bgColor="#FFFFFF" fgColor="#FF8C00" />
            </View>
            <Text style={styles.modalHint}>Code: {roomCode}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showTopicSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowTopicSheet(false)} />
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Select Topic</Text>
            {TOPIC_OPTIONS.map(option => {
              const isSelected = selectedTopicCategory === option.key;

              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.sheetOptionRow,
                    isSelected && styles.sheetOptionRowActive,
                  ]}
                  onPress={() => {
                    setSelectedTopicCategory(option.key);
                    if (error) {
                      setError('');
                    }
                    setShowTopicSheet(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      isSelected && styles.sheetOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? <Text style={styles.sheetOptionCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollContentWithFooter: {
    paddingBottom: 130,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7D7D7D',
    textAlign: 'center',
    marginBottom: 16,
  },
  setupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 1.4,
    marginBottom: 10,
    marginTop: 4,
  },
  roomNameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFCF99',
    color: '#1A1A1A',
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontWeight: '700',
  },
  topicSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFD7AE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicSelectorText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  topicSelectorChevron: {
    color: '#A85A00',
    fontSize: 12,
    fontWeight: '900',
  },
  customTopicInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFD7AE',
    color: '#1A1A1A',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontWeight: '700',
  },
  topicSelectorDisabled: {
    backgroundColor: '#F7F7F7',
    borderColor: '#E4E4E4',
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  inviteHubCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 20,
    marginBottom: 16,
  },
  lobbyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B6B6B',
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FF8C00',
    letterSpacing: 8,
  },
  qrIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FFD6A4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrIconText: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 12,
  },
  inviteHint: {
    marginTop: 8,
    color: '#8A8A8A',
    fontSize: 12,
  },
  playerLoungeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 18,
    marginBottom: 16,
  },
  playerHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  playerSlot: {
    width: '30%',
    alignItems: 'center',
  },
  playerAvatarFilled: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playerAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  hostCrown: {
    position: 'absolute',
    top: -10,
    right: -4,
    fontSize: 14,
  },
  playerName: {
    marginTop: 6,
    fontSize: 11,
    color: '#555555',
    fontWeight: '700',
    maxWidth: 74,
    textAlign: 'center',
  },
  playerMeta: {
    marginTop: 2,
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '600',
  },
  playerAvatarEmpty: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  emptySlotText: {
    fontSize: 24,
    color: '#B7B7B7',
    fontWeight: '500',
  },
  emptySlotLabel: {
    marginTop: 6,
    fontSize: 11,
    color: '#B0B0B0',
    fontWeight: '600',
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 18,
  },
  configHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  configHint: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  choiceChip: {
    minWidth: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFF7EC',
    borderWidth: 1,
    borderColor: '#FFD9B1',
    alignItems: 'center',
  },
  choiceChipActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  choiceChipDisabled: {
    opacity: 0.5,
  },
  choiceChipText: {
    color: '#A85A00',
    fontWeight: '800',
  },
  choiceChipTextActive: {
    color: '#FFFFFF',
  },
  footerBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 10,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  buttonDisabled: {
    backgroundColor: '#D8D8D8',
    borderColor: '#D8D8D8',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  qrCanvas: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE0BB',
  },
  modalHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#888888',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#ECECEC',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sheetOptionRowActive: {
    backgroundColor: '#FFF7EC',
  },
  sheetOptionText: {
    fontSize: 14,
    color: '#3D3D3D',
    fontWeight: '700',
  },
  sheetOptionTextActive: {
    color: '#A85A00',
  },
  sheetOptionCheck: {
    fontSize: 13,
    color: '#FF8C00',
    fontWeight: '900',
  },
  errorText: {
    marginTop: 10,
    color: '#D23A3A',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
});
