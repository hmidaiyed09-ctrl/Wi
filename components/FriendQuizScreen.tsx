import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  subscribeToRoom,
  type RoomState,
} from '../services/firebaseRooms';

type Props = {
  roomCode: string;
  localPlayerId: string;
  onLeave: () => void;
};

export default function FriendQuizScreen({
  roomCode,
  localPlayerId,
  onLeave,
}: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const unsubscribe = subscribeToRoom(
      roomCode,
      (updatedRoom) => {
        setRoom(updatedRoom);
        setError('');
      },
      (err) => {
        setError(err.message || 'Connection lost');
      },
    );

    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Room Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={onLeave} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </Pressable>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Connecting to room {roomCode}…</Text>
      </View>
    );
  }

  const currentPlayer = room.players.find((p) => p.id === localPlayerId);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Room: {room.roomName}</Text>
        <Text style={styles.codeText}>Code: {room.code}</Text>
        <Text style={styles.statusText}>
          Status: {room.status === 'in_game' ? 'In Game' : 'Waiting'}
        </Text>

        <Text style={styles.sectionTitle}>
          Players ({room.players.length})
        </Text>
        {room.players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>
              {player.name}
              {player.isHost ? ' (Host)' : ''}
              {player.id === localPlayerId ? ' (You)' : ''}
            </Text>
          </View>
        ))}

        {room.status === 'waiting' && (
          <Text style={styles.waitingText}>
            Waiting for the host to start the game…
          </Text>
        )}

        <Pressable onPress={onLeave} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Leave Room</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1D2A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 18,
    color: '#FF8C00',
    fontWeight: '700',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 15,
    color: '#8B8FAD',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  playerRow: {
    backgroundColor: '#2A2D3E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    width: '100%',
    minWidth: 260,
  },
  playerName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  waitingText: {
    marginTop: 24,
    fontSize: 15,
    color: '#8B8FAD',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B8FAD',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
  },
  leaveButton: {
    marginTop: 32,
    backgroundColor: '#E74C3C',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
