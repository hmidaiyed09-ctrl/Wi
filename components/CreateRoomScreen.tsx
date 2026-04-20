import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import type { RoomState } from '../services/firebaseRooms';

type Props = {
  onBack: () => void;
  profileName: string;
};

export default function CreateRoomScreen({ onBack, profileName }: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupRoom = async () => {
      setIsCreating(true);
      setError('');

      try {
        const roomService = await import('../services/firebaseRooms');
        const createdRoom = await roomService.createRoom(profileName, 'myfriend');

        if (!isMounted) {
          return;
        }

        setRoom(createdRoom);
        unsubscribe = roomService.subscribeToRoom(
          createdRoom.code,
          (updatedRoom) => {
            if (isMounted) {
              setRoom(updatedRoom);
            }
          },
          () => {
            if (isMounted) {
              setError('Live updates are temporarily unavailable.');
            }
          },
        );
      } catch {
        if (isMounted) {
          setError('Unable to create room right now. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsCreating(false);
        }
      }
    };

    setupRoom();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [profileName]);

  const players = room?.players ?? [];
  const playerCount = players.length;
  const hostProfile = players.find((player) => player.isHost);
  const roomName = room?.roomName ?? 'myfriend';
  const roomCode = room?.code ?? '------';

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Create Room</Text>
      <Text style={styles.subtitle}>Your friends can join with the room code</Text>

      <View style={styles.roomNameCard}>
        <Text style={styles.roomNameLabel}>ROOM NAME</Text>
        <Text style={styles.roomNameValue}>{roomName}</Text>
      </View>

      {/* Room Code Display */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>ROOM CODE</Text>
        <Text style={styles.codeText}>{roomCode}</Text>
      </View>

      {/* QR Code Placeholder */}
      <View style={styles.qrCard}>
        <View style={styles.qrPlaceholder}>
          {isCreating ? <ActivityIndicator color="#FF8C00" /> : <Text style={styles.qrPlaceholderText}>QR COMING SOON</Text>}
        </View>
        <Text style={styles.qrHint}>QR scan integration will be added in a later sprint</Text>
      </View>

      {/* Host Profile */}
      <View style={styles.profileCard}>
        <Text style={styles.sectionLabel}>HOST PROFILE</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(hostProfile?.name ?? profileName).slice(0, 1).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{hostProfile?.name ?? profileName}</Text>
            <Text style={styles.profileRole}>Room host</Text>
          </View>
        </View>
      </View>

      {/* Waiting Status */}
      <View style={styles.waitingCard}>
        <ActivityIndicator size="small" color="#FF8C00" />
        <Text style={styles.waitingText}>Waiting for players...</Text>
        <View style={styles.playerRow}>
          <Text style={styles.playerEmoji}>👤</Text>
          <Text style={styles.playerCount}>{playerCount} player{playerCount > 1 ? 's' : ''} in room</Text>
        </View>
        {players.map((player) => (
          <Text key={player.id} style={styles.playerLine}>
            • {player.name}{player.isHost ? ' (host)' : ''}
          </Text>
        ))}
      </View>

      {/* Waiting Options */}
      <View style={styles.optionsCard}>
        <Text style={styles.sectionLabel}>WAITING OPTIONS</Text>
        <Text style={styles.optionLine}>Auto-start match when 2+ players (coming soon)</Text>
        <Text style={styles.optionLine}>Kick/ban controls (coming soon)</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Start Game Button */}
      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          { opacity: pressed ? 0.85 : 1 },
          playerCount < 2 && styles.startButtonDisabled,
        ]}
        disabled={playerCount < 2}
      >
        <Text style={styles.startButtonText}>
          {playerCount < 2 ? 'Waiting for more players...' : 'Start Game'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1D2A',
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B8FAD',
    textAlign: 'center',
    marginBottom: 16,
  },
  roomNameCard: {
    backgroundColor: '#252840',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#33365A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  roomNameLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8FAD',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  roomNameValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  codeCard: {
    backgroundColor: '#252840',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#33365A',
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B8FAD',
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FF8C00',
    letterSpacing: 8,
  },
  qrCard: {
    backgroundColor: '#252840',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#33365A',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  qrPlaceholder: {
    width: 190,
    height: 190,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4A4E70',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1F2235',
  },
  qrPlaceholderText: {
    color: '#9DA3CC',
    fontWeight: '700',
    letterSpacing: 1,
  },
  qrHint: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#8B8FAD',
  },
  profileCard: {
    backgroundColor: '#252840',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#33365A',
    padding: 18,
    marginBottom: 16,
    width: '100%',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8FAD',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B1D2A',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileRole: {
    marginTop: 2,
    fontSize: 13,
    color: '#A6ABCB',
  },
  waitingCard: {
    backgroundColor: '#252840',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#33365A',
    padding: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    width: '100%',
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerEmoji: {
    fontSize: 16,
  },
  playerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B8FAD',
  },
  playerLine: {
    fontSize: 13,
    color: '#C7CBEA',
  },
  optionsCard: {
    backgroundColor: '#252840',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#33365A',
    padding: 18,
    marginBottom: 16,
    width: '100%',
  },
  optionLine: {
    fontSize: 13,
    color: '#C7CBEA',
    marginBottom: 6,
  },
  errorText: {
    marginBottom: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#33365A',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
