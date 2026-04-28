import React, { useEffect, useRef, useState } from 'react';
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
import QRCode from 'react-native-qrcode-svg';
import type { RoomState } from '../services/firebaseRooms';

const MAX_PLAYERS = 8;

export type FriendDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type FriendLobbyConfig = {
  topic: string;
  questionCount: number;
  difficulty: FriendDifficulty;
};

type FriendCategory =
  | 'entertainment'
  | 'sports'
  | 'general_knowledge'
  | 'science'
  | 'history'
  | 'custom';

const CATEGORY_OPTIONS: {
  key: FriendCategory;
  label: string;
  emoji: string;
  topic: string;
}[] = [
  {
    key: 'entertainment',
    label: 'Entertainment',
    emoji: '🎬',
    topic: 'Entertainment, movies, music, TV shows, celebrities, pop culture',
  },
  {
    key: 'sports',
    label: 'Sports',
    emoji: '⚽',
    topic: 'Sports, football, basketball, Olympics, athletes, competitions',
  },
  {
    key: 'general_knowledge',
    label: 'General',
    emoji: '🧠',
    topic: 'General knowledge, trivia, world facts, geography, culture',
  },
  {
    key: 'science',
    label: 'Science',
    emoji: '🔬',
    topic: 'Science, physics, chemistry, biology, space, technology',
  },
  {
    key: 'history',
    label: 'History',
    emoji: '📜',
    topic: 'History, world wars, ancient civilizations, historical events',
  },
  { key: 'custom', label: 'Custom', emoji: '✏️', topic: '' },
];

const DIFFICULTY_OPTIONS: FriendDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const QUESTION_COUNT_OPTIONS = [5, 10, 15];

type Props = {
  onBack: () => void;
  onOpenGame: (roomCode: string, localPlayerId: string) => void;
  onStartGame: (args: {
    room: RoomState;
    localPlayerId: string;
    config: FriendLobbyConfig;
  }) => Promise<void>;
  profileName: string;
  profileUid: string;
};

type RoomServiceModule = {
  createRoom: (hostName: string, roomName?: string) => Promise<RoomState>;
  subscribeToRoom: (
    roomCodeInput: string,
    onChange: (room: RoomState) => void,
    onError: (error: Error) => void,
  ) => () => void;
};

const resolveRoomService = async (): Promise<RoomServiceModule> => {
  const module = await import('../services/firebaseRooms');
  const candidate = ((module as { default?: unknown }).default ??
    module) as Partial<RoomServiceModule>;

  if (
    typeof candidate.createRoom !== 'function' ||
    typeof candidate.subscribeToRoom !== 'function'
  ) {
    throw new Error('ROOM_SERVICE_UNAVAILABLE');
  }

  return candidate as RoomServiceModule;
};

const getCreateRoomErrorMessage = (error: unknown): string => {
  const typedError = error as { code?: string; message?: string };
  const errorCode = typedError?.code ? String(typedError.code) : 'unknown';
  const errorMessage = typedError?.message ? String(typedError.message) : '';

  if (!(error instanceof Error)) {
    return 'Unable to create room right now. Please try again.';
  }

  const message = error.message.toLowerCase();
  if (message.includes('permission') || message.includes('denied')) {
    return `Firebase denied room creation (${errorCode}). Please update Firestore rules.`;
  }
  if (
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('unavailable')
  ) {
    return `Network issue while creating room (${errorCode}). ${
      errorMessage || 'Please check your connection.'
    }`;
  }
  if (message.includes('chunk') || message.includes('loading')) {
    return 'Room module failed to load. Refresh and try again.';
  }
  if (message.includes('room_service_unavailable')) {
    return 'Room service failed to initialize. Please refresh the app.';
  }

  return `Unable to create room right now (${errorCode}): ${error.message}`;
};

export default function CreateRoomScreen({
  onBack,
  onOpenGame: _onOpenGame,
  onStartGame,
  profileName,
  profileUid: _profileUid,
}: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomNameInput, setRoomNameInput] = useState('myfriend');
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<FriendCategory>('general_knowledge');
  const [customTopic, setCustomTopic] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<FriendDifficulty>('EASY');

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

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
      const createdRoom = await roomService.createRoom(profileName, trimmedName);
      setRoom(createdRoom);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = roomService.subscribeToRoom(
        createdRoom.code,
        updatedRoom => {
          setRoom(updatedRoom);
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

  const resolveTopic = (): string => {
    if (selectedCategory === 'custom') {
      return customTopic.trim();
    }
    const option = CATEGORY_OPTIONS.find(c => c.key === selectedCategory);
    return option?.topic ?? '';
  };

  const handleStart = async () => {
    if (!room) {
      return;
    }
    const topic = resolveTopic();
    if (!topic) {
      setError('Please pick a category or enter a custom topic.');
      return;
    }
    if (room.players.length < 2) {
      setError('You need at least 2 players to start.');
      return;
    }
    setIsStarting(true);
    setError('');
    try {
      await onStartGame({
        room,
        localPlayerId: room.hostId,
        config: { topic, questionCount, difficulty },
      });
    } catch (startError) {
      const message =
        startError instanceof Error ? startError.message : 'Unknown error';
      setError(`Unable to start game: ${message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const players = room?.players ?? [];
  const playerCount = players.length;
  const roomName = room?.roomName ?? (roomNameInput.trim() || 'myfriend');
  const roomCode = room?.code ?? '------';
  const canStart = playerCount >= 2 && !isStarting;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          room ? styles.scrollContentWithFooter : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Create Room</Text>
        <Text style={styles.subtitle}>
          {room
            ? 'Share your lobby code and configure the quiz'
            : 'Set lobby name and create your room'}
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
                styles.createRoomButton,
                { opacity: pressed ? 0.9 : 1 },
                isCreating && styles.buttonDisabled,
              ]}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createRoomButtonText}>Create Room</Text>
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
                <Pressable
                  style={styles.qrIconButton}
                  onPress={() => setShowQrModal(true)}
                >
                  <Text style={styles.qrIconText}>QR</Text>
                </Pressable>
              </View>
              <Text style={styles.inviteHint}>
                Share this code or open QR to invite friends
              </Text>
            </View>

            <View style={styles.playerLoungeCard}>
              <Text style={styles.playerHeader}>
                Players ({playerCount}/{MAX_PLAYERS})
              </Text>
              <View style={styles.playerGrid}>
                {Array.from({ length: MAX_PLAYERS }).map((_, index) => {
                  const player = players[index];
                  if (player) {
                    return (
                      <View key={player.id} style={styles.playerSlot}>
                        <View style={styles.playerAvatarFilled}>
                          <Text style={styles.playerAvatarText}>
                            {player.name.slice(0, 1).toUpperCase()}
                          </Text>
                          {player.isHost ? (
                            <Text style={styles.hostCrown}>👑</Text>
                          ) : null}
                        </View>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {player.name}
                        </Text>
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
              <Text style={styles.configTitle}>Quiz Setup</Text>

              <Text style={styles.configLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORY_OPTIONS.map(option => {
                  const active = selectedCategory === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => setSelectedCategory(option.key)}
                      style={[
                        styles.categoryChip,
                        active && styles.categoryChipActive,
                      ]}
                    >
                      <Text style={styles.categoryEmoji}>{option.emoji}</Text>
                      <Text
                        style={[
                          styles.categoryChipText,
                          active && styles.categoryChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedCategory === 'custom' ? (
                <>
                  <Text style={styles.configLabel}>Custom topic</Text>
                  <TextInput
                    value={customTopic}
                    onChangeText={setCustomTopic}
                    placeholder="e.g. Football world cup history"
                    placeholderTextColor="#A1A1A1"
                    style={styles.roomNameInput}
                  />
                </>
              ) : null}

              <Text style={styles.configLabel}>Questions</Text>
              <View style={styles.pillRow}>
                {QUESTION_COUNT_OPTIONS.map(count => {
                  const active = questionCount === count;
                  return (
                    <Pressable
                      key={count}
                      onPress={() => setQuestionCount(count)}
                      style={[
                        styles.pill,
                        active && styles.pillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          active && styles.pillTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.configLabel}>Difficulty</Text>
              <View style={styles.pillRow}>
                {DIFFICULTY_OPTIONS.map(opt => {
                  const active = difficulty === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setDifficulty(opt)}
                      style={[
                        styles.pill,
                        active && styles.pillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          active && styles.pillTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
      </ScrollView>

      {room ? (
        <View style={styles.footerBar}>
          <Pressable
            style={styles.settingsButton}
            onPress={() => setShowSettingsSheet(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
          <Pressable
            onPress={handleStart}
            disabled={!canStart}
            style={[styles.startButton, !canStart && styles.buttonDisabled]}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>START GAME</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <Modal visible={showQrModal} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowQrModal(false)}
        >
          <Pressable style={styles.qrModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Invite QR</Text>
            <View style={styles.qrCanvas}>
              <QRCode
                value={roomCode}
                size={170}
                bgColor="#FFFFFF"
                fgColor="#FF8C00"
              />
            </View>
            <Text style={styles.modalHint}>Code: {roomCode}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showSettingsSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowSettingsSheet(false)}
          />
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Lobby Settings</Text>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetRowLabel}>Kick/Ban controls</Text>
              <Text style={styles.sheetRowValueSoon}>Soon</Text>
            </View>
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
  createRoomButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createRoomButtonText: {
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
    width: '23%',
    alignItems: 'center',
  },
  playerAvatarFilled: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C00',
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
    fontWeight: '600',
    maxWidth: 60,
    textAlign: 'center',
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
  configTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D7D7D',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF6EA',
    borderWidth: 1.5,
    borderColor: '#FFE0BB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  categoryChipActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    color: '#A05A00',
    fontWeight: '700',
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFF6EA',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFE0BB',
  },
  pillActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  pillText: {
    color: '#A05A00',
    fontWeight: '800',
    fontSize: 14,
  },
  pillTextActive: {
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
  settingsButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF6EA',
    borderWidth: 1,
    borderColor: '#FFDDB6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
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
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sheetRowLabel: {
    fontSize: 14,
    color: '#3D3D3D',
    fontWeight: '600',
  },
  sheetRowValueSoon: {
    fontSize: 13,
    color: '#9B9B9B',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: '#D23A3A',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
});
