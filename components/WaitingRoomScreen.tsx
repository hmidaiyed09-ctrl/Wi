import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Props = {
  roomId: string;
  isHost: boolean;
  onBack: () => void;
  onStartGame: (roomId: string) => void;
};

export default function WaitingRoomScreen({ roomId, isHost, onBack, onStartGame }: Props) {
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        if (data.status === 'started') {
          onStartGame(roomId);
        }
      } else {
        // Room was deleted or something
        onBack();
      }
    });
    return () => unsub();
  }, [roomId]);

  const handleStartGame = async () => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), { status: 'started' });
    } catch(e) {
      console.error(e);
    }
  };

  if (!roomData) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Leave Room</Text>
      </Pressable>

      <Text style={styles.title}>Waiting Room</Text>
      <Text style={styles.subtitle}>Invite friends using this code or QR!</Text>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>ROOM KEY</Text>
        <Text style={styles.codeValue}>{roomId}</Text>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          <QRCode
            value={roomId}
            size={180}
            color="#FFFFFF"
            backgroundColor="transparent"
          />
        </View>
      </View>

      <ScrollView style={styles.playersList} contentContainerStyle={{ gap: 10 }}>
        <Text style={styles.playersTitle}>Players joined:</Text>
        <View style={[styles.playerCard, { borderColor: '#FF8C00' }]}>
          <Text style={styles.playerAvatar}>👑</Text>
          <Text style={styles.playerName}>Host (You)</Text>
        </View>
        <View style={styles.playerCard}>
          <Text style={styles.playerAvatar}>👤</Text>
          <Text style={styles.playerName}>Friend 1 (Simulated)</Text>
        </View>
        {/* Because this demo lacks real auth, we just show a static or simple player list. 
            Realistically we would use FirebaseAuth and update a 'players' array. 
            For now, we just wait for anyone to hit start! */}
      </ScrollView>

      {isHost ? (
        <Pressable style={styles.startButton} onPress={handleStartGame}>
          <Text style={styles.startButtonText}>Start Game now</Text>
        </Pressable>
      ) : (
        <View style={styles.waitingNotice}>
          <ActivityIndicator color="#FF8C00" style={{ marginRight: 8 }} />
          <Text style={styles.waitingNoticeText}>Waiting for host to start...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerCenter: {
    flex: 1,
    backgroundColor: '#1B1D2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#1B1D2A',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
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
    marginBottom: 24,
  },
  codeContainer: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  codeLabel: {
    fontSize: 11,
    color: '#FF8C00',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#252840',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#33365A',
  },
  playersTitle: {
    fontSize: 14,
    color: '#8B8FAD',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  playersList: {
    flex: 1,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252840',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#33365A',
    gap: 12,
  },
  playerAvatar: {
    fontSize: 20,
  },
  playerName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  waitingNotice: {
    flexDirection: 'row',
    backgroundColor: '#252840',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#33365A',
  },
  waitingNoticeText: {
    color: '#8B8FAD',
    fontSize: 16,
    fontWeight: '600',
  },
});
