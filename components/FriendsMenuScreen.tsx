import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type Props = {
  onBack: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
};

export default function FriendsMenuScreen({ onBack, onCreateRoom, onJoinRoom }: Props) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Play with Friends</Text>
      <Text style={styles.subtitle}>Create a room or join an existing one</Text>

      <View style={styles.cardsContainer}>
        <Pressable
          onPress={onCreateRoom}
          style={({ pressed }) => [
            styles.card,
            styles.cardCreate,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.cardEmoji}>🏠</Text>
          <Text style={styles.cardTitle}>Create Room</Text>
          <Text style={styles.cardDesc}>
            Generate a room code and QR for friends to join
          </Text>
        </Pressable>

        <Pressable
          onPress={onJoinRoom}
          style={({ pressed }) => [
            styles.card,
            styles.cardJoin,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.cardEmoji}>🔑</Text>
          <Text style={styles.cardTitle}>Join Room</Text>
          <Text style={styles.cardDesc}>
            Enter a 6-digit code to join a friend's room
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1D2A',
    paddingTop: 50,
    paddingHorizontal: 20,
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
    marginBottom: 40,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  cardCreate: {
    backgroundColor: '#FF8C00',
  },
  cardJoin: {
    backgroundColor: '#252840',
    borderWidth: 2,
    borderColor: '#33365A',
  },
  cardEmoji: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
