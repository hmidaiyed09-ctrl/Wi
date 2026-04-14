import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  onSignUp: (name: string, email: string, password: string) => void;
  onGoToLogin: () => void;
};

export default function SignUpScreen({ onSignUp, onGoToLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [logoScale, logoOpacity, formTranslateY, formOpacity]);

  const clearError = () => { if (error) setError(''); };

  const handleSignUp = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSignUp(name.trim(), email.trim(), password.trim());
    }, 800);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.logoArea,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Text style={styles.logoLabel}>Welcome to</Text>
          <Text style={styles.logo}>Wi</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: formOpacity, transform: [{ translateY: formTranslateY }] },
          ]}
        >
          <Text style={styles.cardTitle}>Sign Up</Text>
          <Text style={styles.cardSubtitle}>Create your account</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(t) => { setName(t); clearError(); }}
            placeholder="Full Name"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => { setEmail(t); clearError(); }}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(t) => { setPassword(t); clearError(); }}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
              loading && { opacity: 0.7 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FF8C00" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          <Pressable onPress={onGoToLogin} style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Login</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF8C00',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 44,
    marginBottom: 24,
  },
  logoLabel: {
    fontSize: 28,
    color: 'black',
    fontWeight: 'bold',
    marginBottom: -14,
  },
  logo: {
    fontSize: 90,
    color: 'white',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 2, height: 8 },
    textShadowRadius: 10,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 14,
  },
  error: {
    color: '#FFD4D4',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 56,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: '800',
  },
  link: {
    marginTop: 22,
  },
  linkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },
  linkBold: {
    color: 'white',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
