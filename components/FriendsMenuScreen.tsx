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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Text style={[styles.cardTitle, styles.cardTitleOnOrange]}>Create Room</Text>
            <Text style={[styles.cardDesc, styles.cardDescOnOrange]}>
              Create room "myfriend", get a code, and wait for your friends.
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
              Enter a 6-digit code now. Camera scan will be added soon.
            </Text>
          </Pressable>
        </View>
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
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  cardCreate: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  cardJoin: {
    backgroundColor: '#FFFFFF',
  },
  cardEmoji: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  cardTitleOnOrange: {
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 14,
    color: '#6F6F6F',
    textAlign: 'center',
  },
  cardDescOnOrange: {
    color: 'rgba(255,255,255,0.9)',
  },
});
