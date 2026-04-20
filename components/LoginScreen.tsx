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
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onGoToSignUp: () => void;
};

const getLoginErrorMessage = (error: unknown): string => {
  const code = typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof (error as { code?: unknown }).code === 'string'
    ? String((error as { code: string }).code)
    : '';

  const message = error instanceof Error ? error.message : '';

  if (message === 'GOOGLE_USERNAME_REQUIRED') {
    return 'This Google account is new. Go to Sign Up and enter a username first.';
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled.';
  }

  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google popup. Please allow popups and try again.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your connection and try again.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (message === 'GOOGLE_SIGN_IN_WEB_ONLY') {
    return 'Google sign-in is available on web only in this build.';
  }

  if (message.length > 0) {
    return message;
  }

  return 'Login failed. Please try again.';
};

export default function LoginScreen({ onLogin, onGoogleLogin, onGoToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await onLogin(email.trim(), password.trim());
    } catch (caughtError) {
      setError(getLoginErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await onGoogleLogin();
    } catch (caughtError) {
      setError(getLoginErrorMessage(caughtError));
    } finally {
      setGoogleLoading(false);
    }
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
          <Text style={styles.cardTitle}>Login</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
              onPress={handleLogin}
              disabled={loading || googleLoading}
              style={({ pressed }) => [
                styles.button,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
                (loading || googleLoading) && { opacity: 0.7 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FF8C00" size="small" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>

           <Pressable
             onPress={handleGoogleLogin}
             disabled={loading || googleLoading}
             style={({ pressed }) => [
               styles.googleButton,
               { transform: [{ scale: pressed ? 0.96 : 1 }] },
               (loading || googleLoading) && { opacity: 0.7 },
             ]}
           >
             {googleLoading ? (
               <ActivityIndicator color="#FFFFFF" size="small" />
             ) : (
               <Text style={styles.googleButtonText}>Continue with Google</Text>
             )}
           </Pressable>

           <Pressable onPress={onGoToSignUp} style={styles.link}>
             <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkBold}>Sign Up</Text>
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
  googleButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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
