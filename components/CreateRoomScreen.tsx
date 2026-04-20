import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import type { RoomState } from '../services/firebaseRooms';

type Props = {
  onBack: () => void;
  profileName: string;
};

export default function CreateRoomScreen({ onBack, profileName }: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomNameInput, setRoomNameInput] = useState('myfriend');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
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
      const roomService = await import('../services/firebaseRooms');
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
        () => {
          setError('Live updates are temporarily unavailable.');
        },
      );
    } catch {
      setError('Unable to create room right now. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const players = room?.players ?? [];
  const playerCount = players.length;
  const hostProfile = players.find((player) => player.isHost);
  const roomName = room?.roomName ?? 'myfriend';
  const roomCode = room?.code ?? '------';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Create Room</Text>
        <Text style={styles.subtitle}>Set your room name, then create it</Text>

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
            />
            <Pressable
              onPress={handleCreateRoom}
              disabled={isCreating}
              style={({ pressed }) => [
                styles.createRoomButton,
                { opacity: pressed ? 0.9 : 1 },
                isCreating && styles.startButtonDisabled,
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
            <View style={styles.roomNameCard}>
              <Text style={styles.roomNameLabel}>ROOM NAME</Text>
              <View style={styles.roomNamePill}>
                <Text style={styles.roomNameValue}>{roomName}</Text>
              </View>
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
          </>
        )}
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
    marginBottom: 16,
  },
  setupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 18,
    marginBottom: 20,
    width: '100%',
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
  roomNameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  roomNameLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9B9B9B',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  roomNamePill: {
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  roomNameValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
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
    borderColor: '#FFD6A4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF8EF',
  },
  qrPlaceholderText: {
    color: '#FF8C00',
    fontWeight: '700',
    letterSpacing: 1,
  },
  qrHint: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8A',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 18,
    marginBottom: 16,
    width: '100%',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
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
    color: '#1A1A1A',
  },
  profileRole: {
    marginTop: 2,
    fontSize: 13,
    color: '#8A8A8A',
  },
  waitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    width: '100%',
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
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
    color: '#6B6B6B',
  },
  playerLine: {
    fontSize: 13,
    color: '#4F4F4F',
  },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    padding: 18,
    marginBottom: 16,
    width: '100%',
  },
  optionLine: {
    fontSize: 13,
    color: '#5C5C5C',
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
    backgroundColor: '#E5E5E5',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
