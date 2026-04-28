import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Camera,
  isScannedCode,
  useCameraPermission,
  useObjectOutput,
} from 'react-native-vision-camera';
import type { RoomState } from '../services/firebaseRooms';

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
  ) => Promise<{ room: RoomState; localPlayerId: string }>;
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
    typeof candidate.joinRoom !== 'function' ||
    typeof candidate.subscribeToRoom !== 'function'
  ) {
    throw new Error('ROOM_SERVICE_UNAVAILABLE');
  }

  return candidate as RoomServiceModule;
};

const extractRoomCode = (rawValue: string): string | null => {
  const directCode = rawValue.replace(/\D/g, '');
  if (directCode.length === 6) {
    return directCode;
  }

  const embeddedMatch = rawValue.match(/(?:^|[^0-9])(\d{6})(?:[^0-9]|$)/);
  return embeddedMatch?.[1] ?? null;
};

export default function JoinRoomScreen({
  onBack,
  onOpenGame,
  profileName,
  profileUid: _profileUid,
}: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<RoomState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const navigatedRef = useRef(false);
  const scannedRef = useRef(false);
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Auto-navigate to FriendQuiz once host starts the game.
  useEffect(() => {
    if (
      joinedRoom &&
      joinedRoom.status === 'in_game' &&
      localPlayerId &&
      !navigatedRef.current
    ) {
      navigatedRef.current = true;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      onOpenGame(joinedRoom.code, localPlayerId);
    }
  }, [joinedRoom, localPlayerId, onOpenGame]);

  const handleJoinRoom = async (providedCode?: string) => {
    const codeToJoin = (providedCode ?? roomCode).replace(/\D/g, '').slice(0, 6);
    if (codeToJoin.length !== 6) {
      setError('Please enter a valid 6-digit room code.');
      return;
    }

    setError('');
    setIsJoining(true);

    try {
      const roomService = await resolveRoomService();
      const result = await roomService.joinRoom(codeToJoin, profileName);
      setJoinedRoom(result.room);
      setRoomCode(result.room.code);
      setLocalPlayerId(result.localPlayerId);
      setShowScanner(false);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = roomService.subscribeToRoom(
        result.room.code,
        updatedRoom => {
          setJoinedRoom(updatedRoom);
          setError('');
        },
        () => {
          setError('Live room updates are temporarily unavailable.');
        },
      );
    } catch (caughtError) {
      if (
        caughtError instanceof Error &&
        caughtError.message === 'INVALID_ROOM_CODE'
      ) {
        setError('Please enter a valid 6-digit room code.');
      } else if (
        caughtError instanceof Error &&
        caughtError.message === 'ROOM_NOT_FOUND'
      ) {
        setError('Room not found. Check the code and try again.');
      } else if (
        caughtError instanceof Error &&
        caughtError.message === 'ROOM_SERVICE_UNAVAILABLE'
      ) {
        setError('Room service failed to initialize. Please refresh the app.');
      } else {
        setError('Unable to join room right now. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const objectOutput = useObjectOutput({
    types: ['qr'],
    onObjectsScanned: objects => {
      if (scannedRef.current || isJoining || joinedRoom) {
        return;
      }

      for (const object of objects) {
        if (!isScannedCode(object) || !object.value) {
          continue;
        }
        const scannedCode = extractRoomCode(object.value);
        if (!scannedCode) {
          continue;
        }

        scannedRef.current = true;
        setShowScanner(false);
        setRoomCode(scannedCode);
        setError('');
        handleJoinRoom(scannedCode);
        return;
      }
    },
  });

  const handleOpenScanner = async () => {
    setError('');
    setCameraError('');

    if (!hasPermission) {
      if (!canRequestPermission) {
        setError('Camera permission is blocked. Enable it in settings.');
        return;
      }
      const granted = await requestPermission();
      if (!granted) {
        setError('Camera permission is required to scan QR codes.');
        return;
      }
    }

    scannedRef.current = false;
    setShowScanner(true);
  };

  const canSubmit = roomCode.length === 6 && !isJoining && !joinedRoom;

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
        <Text style={styles.subtitle}>
          Enter the 6-digit code to join your friend
        </Text>

        <Pressable onPress={handleOpenScanner} style={styles.scanButton}>
          <Text style={styles.scanButtonText}>Scan with Camera</Text>
        </Pressable>

        {!joinedRoom ? (
          <>
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
              style={[styles.joinButton, !canSubmit && styles.joinButtonDisabled]}
            >
              {isJoining ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.joinButtonText}>Join Room</Text>
              )}
            </Pressable>
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {joinedRoom ? (
          <View style={styles.joinedCard}>
            <Text style={styles.joinedTitle}>Joined: {joinedRoom.roomName}</Text>
            <Text style={styles.joinedCode}>Code: {joinedRoom.code}</Text>
            <Text style={styles.joinedStatus}>
              {joinedRoom.status === 'in_game'
                ? 'Game starting…'
                : joinedRoom.status === 'finished'
                ? 'Game ended'
                : 'Waiting for the host to start the game…'}
            </Text>
            <Text style={styles.playersTitle}>
              Players ({joinedRoom.players.length})
            </Text>
            {joinedRoom.players.map(player => (
              <Text key={player.id} style={styles.playerLine}>
                • {player.name}
                {player.isHost ? ' (host)' : ''}
                {player.id === localPlayerId ? ' (you)' : ''}
              </Text>
            ))}
            {joinedRoom.status === 'waiting' ? (
              <ActivityIndicator
                style={styles.waitingSpinner}
                color="#FF8C00"
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showScanner} transparent animationType="slide">
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerCard}>
            <Text style={styles.scannerTitle}>Scan Invite QR</Text>
            <View style={styles.cameraFrame}>
              <Camera
                style={styles.cameraPreview}
                device="back"
                isActive={showScanner}
                outputs={[objectOutput]}
                onError={caughtError =>
                  setCameraError(caughtError.message || 'Camera failed to start.')
                }
              />
              <View pointerEvents="none" style={styles.scanGuide} />
            </View>
            <Text style={styles.scannerHint}>
              Align the room QR code inside the frame
            </Text>
            {cameraError ? <Text style={styles.errorText}>{cameraError}</Text> : null}
            <Pressable
              style={styles.closeScannerButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.closeScannerButtonText}>Close Scanner</Text>
            </Pressable>
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
  },
  playersTitle: {
    color: '#999999',
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  playerLine: {
    color: '#444444',
    marginBottom: 4,
  },
  waitingSpinner: {
    marginTop: 16,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  scannerCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  scannerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  cameraFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 340,
    backgroundColor: '#111111',
    position: 'relative',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  scanGuide: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: '28%',
    bottom: '28%',
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    marginTop: 10,
    textAlign: 'center',
    color: '#7D7D7D',
    fontSize: 12,
  },
  closeScannerButton: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  closeScannerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
