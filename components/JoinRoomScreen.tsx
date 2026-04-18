import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Props = {
  onBack: () => void;
  onRoomJoined: (roomId: string) => void;
};

export default function JoinRoomScreen({ onBack, onRoomJoined }: Props) {
  const [roomKey, setRoomKey] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (isScanning && !hasPermission) {
      requestPermission();
    }
  }, [isScanning, hasPermission, requestPermission]);

  const validateAndJoin = async (key: string) => {
    if (!key || key.length < 4) {
      Alert.alert('Error', 'Invalid room key.');
      return;
    }
    setLoading(true);
    try {
      const roomRef = doc(db, 'rooms', key);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists() && roomSnap.data().status === 'waiting') {
        onRoomJoined(key);
      } else {
        Alert.alert('Not Found', 'Room does not exist or has already started.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to connect to room.');
    } finally {
      setLoading(false);
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        setIsScanning(false);
        validateAndJoin(codes[0].value);
      }
    }
  });

  if (isScanning) {
    if (!hasPermission) {
      return (
        <View style={styles.container}>
          <Text style={styles.subtitle}>Requesting camera permission...</Text>
          <Pressable onPress={() => setIsScanning(false)} style={styles.scanCancel}>
            <Text style={styles.scanCancelText}>Cancel</Text>
          </Pressable>
        </View>
      );
    }
    if (device == null) {
      return (
        <View style={styles.container}>
          <Text style={styles.subtitle}>No camera device found</Text>
          <Pressable onPress={() => setIsScanning(false)} style={styles.scanCancel}>
            <Text style={styles.scanCancelText}>Cancel</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.containerFull}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
        <View style={styles.scanOverlay}>
          <Text style={styles.scanInstruction}>Scan the host's QR Code</Text>
          <View style={styles.scanTarget} />
          <Pressable onPress={() => setIsScanning(false)} style={styles.scanCancel}>
            <Text style={styles.scanCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Join Room</Text>
      <Text style={styles.subtitle}>Enter the 6-digit key or scan the QR</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Room Key..."
          placeholderTextColor="#666"
          value={roomKey}
          onChangeText={setRoomKey}
          autoCapitalize="characters"
        />
        <Pressable 
          style={styles.joinButton} 
          onPress={() => validateAndJoin(roomKey)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinButtonText}>Join</Text>}
        </Pressable>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={styles.scanButton}
        onPress={() => setIsScanning(true)}
      >
        <Text style={styles.scanButtonEmoji}>⊞</Text>
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  containerFull: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  scanInstruction: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scanCancel: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  scanCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
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
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  input: {
    flex: 1,
    backgroundColor: '#252840',
    borderWidth: 2,
    borderColor: '#33365A',
    borderRadius: 16,
    color: '#fff',
    fontSize: 18,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 2,
  },
  joinButton: {
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#33365A',
  },
  dividerText: {
    color: '#8B8FAD',
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#252840',
    borderWidth: 2,
    borderColor: '#33365A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanButtonEmoji: {
    fontSize: 24,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
