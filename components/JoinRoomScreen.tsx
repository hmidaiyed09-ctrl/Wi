import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { RoomState } from '../services/firebaseRooms';

type Props = {
  onBack: () => void;
  profileName: string;
};

export default function JoinRoomScreen({ onBack, profileName }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<RoomState | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const handleJoinRoom = async () => {
    setError('');
    setIsJoining(true);

    try {
      const roomService = await import('../services/firebaseRooms');
      const room = await roomService.joinRoom(roomCode, profileName);
      setJoinedRoom(room);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = roomService.subscribeToRoom(
        room.code,
        (updatedRoom) => {
          setJoinedRoom(updatedRoom);
          setError('');
        },
        () => {
          setError('Live room updates are temporarily unavailable.');
        },
      );
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message === 'INVALID_ROOM_CODE') {
        setError('Please enter a valid 6-digit room code.');
      } else if (caughtError instanceof Error && caughtError.message === 'ROOM_NOT_FOUND') {
        setError('Room not found. Check the code and try again.');
      } else {
        setError('Unable to join room right now. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
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
        <Text style={styles.subtitle}>Enter the 6-digit code to join your friend</Text>

        <Pressable disabled style={styles.scanPlaceholderButton}>
          <Text style={styles.scanPlaceholderButtonText}>Scan with Camera (Coming soon)</Text>
        </Pressable>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <TextInput
            style={styles.codeInput}
            value={roomCode}
            onChangeText={(text) => {
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
            <Text style={styles.joinedStatus}>Status: {joinedRoom.status}</Text>
            <Text style={styles.playersTitle}>Players</Text>
            {joinedRoom.players.map((player) => (
              <Text key={player.id} style={styles.playerLine}>
                • {player.name}{player.isHost ? ' (host)' : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
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
  scanPlaceholderButton: {
    backgroundColor: '#FFF5E8',
    borderWidth: 1,
    borderColor: '#FFD8AA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  scanPlaceholderButtonText: {
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
});
