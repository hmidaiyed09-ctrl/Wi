import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

type Props = {
  onBack: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
};

export default function FriendsMenuScreen({ onBack, onCreateRoom, onJoinRoom }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Play With Friends</Text>
        <Text style={styles.subtitle}>Host or join a challenge</Text>

        <View style={styles.optionsContainer}>
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onCreateRoom}
          >
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>🏠</Text>
            </View>
            <Text style={styles.cardTitle}>Create a Room</Text>
            <Text style={styles.cardSubtitle}>Host a game and let friends join via code or QR.</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onJoinRoom}
          >
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>🤝</Text>
            </View>
            <Text style={styles.cardTitle}>Join a Room</Text>
            <Text style={styles.cardSubtitle}>Join a friend's hosted game by scanning their QR code or typing their key.</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1D2A',
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 60,
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
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#252840',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#33365A',
    padding: 24,
    alignItems: 'center',
  },
  cardPressed: {
    borderColor: '#FF8C00',
    backgroundColor: '#2A2D46',
  },
  cardIconBox: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8B8FAD',
    textAlign: 'center',
    lineHeight: 18,
  },
});
