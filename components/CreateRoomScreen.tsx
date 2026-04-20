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
import { QRCodeSVG } from 'qrcode.react';
import type { RoomState } from '../services/firebaseRooms';

type Props = {
  onBack: () => void;
  profileName: string;
};

const MAX_PLAYERS = 8;
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

  const message = error.message.toLowerCase();
  if (message.includes('permission') || message.includes('denied')) {
    return 'Firebase denied room creation. Please update Firestore rules.';
  }
  if (message.includes('network') || message.includes('offline') || message.includes('unavailable')) {
    return 'Network issue while creating room. Please check your connection.';
  }
  if (message.includes('chunk') || message.includes('loading')) {
    return 'Room module failed to load. Refresh and try again.';
  }
  if (message.includes('room_service_unavailable')) {
    return 'Room service failed to initialize. Please refresh the app.';
  }

  return `Unable to create room right now: ${error.message}`;
};

export default function CreateRoomScreen({ onBack, profileName }: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomNameInput, setRoomNameInput] = useState('myfriend');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
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
        (updatedRoom) => {
          setRoom(updatedRoom);
        },
        (snapshotError) => {
          setError(`Live updates unavailable: ${snapshotError.message}`);
        },
      );
    } catch (createError) {
      setError(getCreateRoomErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  const players = room?.players ?? [];
  const playerCount = players.length;
  const roomName = room?.roomName ?? (roomNameInput.trim() || 'myfriend');
  const roomCode = room?.code ?? '------';

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
          {room ? 'Share your lobby code and wait for players' : 'Set lobby name and create your room'}
        </Text>

        {!room ? (
          <View style={styles.setupCard}>
            <Text style={styles.sectionLabel}>ROOM NAME</Text>
            <TextInput
              value={roomNameInput}
              onChangeText={(text) => {
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
                <Pressable style={styles.qrIconButton} onPress={() => setShowQrModal(true)}>
                  <Text style={styles.qrIconText}>QR</Text>
                </Pressable>
              </View>
              <Text style={styles.inviteHint}>Share this code or open QR to invite friends</Text>
            </View>

            <View style={styles.playerLoungeCard}>
              <Text style={styles.playerHeader}>Players ({playerCount}/{MAX_PLAYERS})</Text>
              <View style={styles.playerGrid}>
                {Array.from({ length: MAX_PLAYERS }).map((_, index) => {
                  const player = players[index];
                  if (player) {
                    return (
                      <View key={player.id} style={styles.playerSlot}>
                        <View style={styles.playerAvatarFilled}>
                          <Text style={styles.playerAvatarText}>{player.name.slice(0, 1).toUpperCase()}</Text>
                          {player.isHost ? <Text style={styles.hostCrown}>👑</Text> : null}
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
      </ScrollView>

      {room ? (
        <View style={styles.footerBar}>
          <Pressable style={styles.settingsButton} onPress={() => setShowSettingsSheet(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
          <Pressable
            style={[
              styles.startButton,
              playerCount < 2 && styles.buttonDisabled,
            ]}
            disabled={playerCount < 2}
          >
            <Text style={styles.startButtonText}>START GAME</Text>
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

      <Modal visible={showSettingsSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowSettingsSheet(false)} />
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Lobby Settings</Text>
            <Pressable
              style={styles.sheetRow}
              onPress={() => setAutoStartEnabled((prev) => !prev)}
            >
              <Text style={styles.sheetRowLabel}>Auto-start when 2+ players</Text>
              <Text style={styles.sheetRowValue}>{autoStartEnabled ? 'ON' : 'OFF'}</Text>
            </Pressable>
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
  sheetRowValue: {
    fontSize: 13,
    color: '#FF8C00',
    fontWeight: '800',
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
