import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PermissionsAndroid,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Camera, CameraType, type OnReadCodeData } from 'react-native-camera-kit';
import type {
  RoomJoinResult,
  RoomState,
} from '../services/firebaseRooms';

type Props = {
  onBack: () => void;
  onOpenGame: (roomCode: string, localPlayerId: string) => void;
  profileName: string;
  profileUid: string;
};

type RoomServiceModule = {
  joinRoom: (
    roomCodeInput: string,
    playerName: string,
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

  if (typeof candidate.joinRoom !== 'function' || typeof candidate.subscribeToRoom !== 'function') {
    throw new Error('ROOM_SERVICE_UNAVAILABLE');
  }

  return candidate as RoomServiceModule;
};

const getJoinErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Unable to join room right now. Please try again.';
  }

  const normalizedMessage = error.message.toLowerCase();

  switch (error.message) {
    case 'INVALID_ROOM_CODE':
      return 'Please enter a valid 6-digit room code.';
    case 'ROOM_NOT_FOUND':
      return 'Room not found. Check the code and try again.';
    case 'ROOM_FULL':
      return 'This room is already full.';
    case 'ROOM_ALREADY_STARTED':
      return 'This friend game already started.';
    case 'ROOM_SERVICE_UNAVAILABLE':
      return 'Room service failed to initialize. Please refresh the app.';
    default:
      if (
        normalizedMessage.includes('permission_denied') ||
        normalizedMessage.includes('permission denied')
      ) {
        return 'Realtime Database denied room access. Please update your RTDB rules in Firebase Console.';
      }
      return `Unable to join room right now: ${error.message}`;
  }
};

const extractRoomCodeFromValue = (rawValue: string): string => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return '';
  }

  if (/^\d{6}$/.test(trimmed)) {
    return trimmed;
  }

  const directMatch = trimmed.match(/\b(\d{6})\b/);
  if (directMatch) {
    return directMatch[1];
  }

  const queryMatch = trimmed.match(
    /[?&](?:roomCode|code|room)=(\d{6})(?:&|$)/i,
  );
  if (queryMatch) {
    return queryMatch[1];
  }

  const pathSegmentMatch = trimmed.match(/\/(\d{6})(?:\/|$)/);
  if (pathSegmentMatch) {
    return pathSegmentMatch[1];
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 6) {
    return digitsOnly;
  }

  return '';
};

export default function JoinRoomScreen({
  onBack,
  onOpenGame,
  profileName,
  profileUid,
}: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<RoomState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const openedGameRef = useRef(false);
  const scanInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!joinedRoom || !localPlayerId || openedGameRef.current) {
      return;
    }

    if (joinedRoom.status === 'in_game' || joinedRoom.status === 'completed') {
      openedGameRef.current = true;
      onOpenGame(joinedRoom.code, localPlayerId);
    }
  }, [joinedRoom, localPlayerId, onOpenGame]);

  const joinRoomByCode = async (targetCode: string) => {
    setError('');
    setIsJoining(true);

    try {
      const roomService = await resolveRoomService();
      const room = await roomService.joinRoom(targetCode, profileName, profileUid);
      setJoinedRoom(room);
      setLocalPlayerId(room.localPlayerId);
      setRoomCode(targetCode);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = roomService.subscribeToRoom(
        room.code,
        updatedRoom => {
          setJoinedRoom(updatedRoom);
          setError('');
        },
        () => {
          setError('Live room updates are temporarily unavailable.');
        },
      );
    } catch (caughtError) {
      setError(getJoinErrorMessage(caughtError));
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    await joinRoomByCode(roomCode);
  };

  const requestCameraAccess = async (): Promise<boolean> => {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (hasPermission) {
      return true;
    }

    const permissionResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera permission',
        message: 'Wi needs camera access to scan room QR codes.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
        buttonNeutral: 'Ask me later',
      },
    );

    return permissionResult === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleOpenScanner = async () => {
    const granted = await requestCameraAccess();
    if (!granted) {
      setError('Camera permission is required to scan a room QR code.');
      return;
    }

    setError('');
    scanInFlightRef.current = false;
    setShowScanner(true);
  };

  const handleScanReadCode = async (event: OnReadCodeData) => {
    if (scanInFlightRef.current || isJoining) {
      return;
    }

    scanInFlightRef.current = true;
    const scannedCode = extractRoomCodeFromValue(
      event.nativeEvent.codeStringValue ?? '',
    );

    if (!scannedCode) {
      setError('Scanned QR code is invalid. Use a valid room QR.');
      scanInFlightRef.current = false;
      return;
    }

    setShowScanner(false);
    await joinRoomByCode(scannedCode);
    scanInFlightRef.current = false;
  };

  const canSubmit = roomCode.length === 6 && !isJoining;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Join Room</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code to join your friends</Text>

        <Pressable onPress={handleOpenScanner} style={styles.scanButton}>
          <Text style={styles.scanButtonText}>Scan with Camera</Text>
        </Pressable>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <TextInput
            style={styles.codeInput}
            value={roomCode}
            onChangeText={text => {
              setRoomCode(text.replace(/\D/g, '').slice(0, 6));
              if (error) {
                setError('');
              }
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor="#A1A1A1"
          />
        </View>

        <Pressable
          onPress={handleJoinRoom}
          disabled={!canSubmit}
          style={[
            styles.joinButton,
            !canSubmit && styles.joinButtonDisabled,
          ]}
        >
          {isJoining ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>Join Room</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {joinedRoom ? (
          <View style={styles.joinedCard}>
            <Text style={styles.joinedTitle}>Joined: {joinedRoom.roomName}</Text>
            <Text style={styles.joinedCode}>Code: {joinedRoom.code}</Text>
            <Text style={styles.joinedStatus}>
              {joinedRoom.status === 'waiting' ? 'Waiting for host to start...' : 'Game is live'}
            </Text>

            <Text style={styles.playersTitle}>Players</Text>
            <View style={styles.playerList}>
              {joinedRoom.players.map(player => {
                const isLocal = player.id === localPlayerId;
                return (
                  <View key={player.id} style={styles.playerRow}>
                    <View style={[styles.playerAvatar, { backgroundColor: player.color }]}>
                      <Text style={styles.playerAvatarText}>
                        {player.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {player.name}
                        {player.isHost ? ' (host)' : ''}
                      </Text>
                      <Text style={styles.playerMeta}>{isLocal ? 'You' : player.color}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => {
          setShowScanner(false);
          scanInFlightRef.current = false;
        }}
      >
        <View style={styles.scannerContainer}>
          <Camera
            style={styles.camera}
            cameraType={CameraType.Back}
            scanBarcode
            showFrame
            frameColor="#FFFFFF"
            laserColor="#FF8C00"
            allowedBarcodeTypes={['qr']}
            onReadCode={event => {
              handleScanReadCode(event).catch(() => {
                setError('Unable to read scanned QR code.');
                scanInFlightRef.current = false;
                setShowScanner(false);
              });
            }}
            onError={cameraError => {
              setError(
                `Camera unavailable: ${cameraError.nativeEvent.errorMessage}`,
              );
              scanInFlightRef.current = false;
              setShowScanner(false);
            }}
          />
          <View style={styles.scannerTopBar}>
            <Text style={styles.scannerTitle}>Scan Room QR</Text>
            <Text style={styles.scannerHint}>
              Point your camera at the room QR to join instantly.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setShowScanner(false);
              scanInFlightRef.current = false;
            }}
            style={styles.closeScannerButton}
          >
            <Text style={styles.closeScannerButtonText}>Close Scanner</Text>
          </Pressable>
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
    paddingBottom: 32,
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
    marginBottom: 26,
  },
  scanButton: {
    backgroundColor: '#FFF5E8',
    borderWidth: 1,
    borderColor: '#FFD8AA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  scanButtonText: {
    color: '#FF8C00',
    fontWeight: '700',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 20,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9B9B9B',
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFCF99',
    color: '#1A1A1A',
    fontSize: 28,
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '800',
  },
  joinButton: {
    marginTop: 16,
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  joinButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '600',
  },
  joinedCard: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 18,
  },
  joinedTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  joinedCode: {
    color: '#FF8C00',
    fontWeight: '700',
    marginBottom: 4,
  },
  joinedStatus: {
    color: '#8A8A8A',
    marginBottom: 12,
    fontWeight: '600',
  },
  playersTitle: {
    color: '#999999',
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  playerList: {
    gap: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  playerMeta: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  scannerTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  scannerHint: {
    marginTop: 6,
    color: '#F0F0F0',
    fontWeight: '600',
  },
  closeScannerButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  closeScannerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
