import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? String((error as { code: string }).code)
      : '';

  const message = error instanceof Error ? error.message : '';

  if (message === 'GOOGLE_USERNAME_REQUIRED') {
    return 'This Google account is new. Go to Sign Up and enter a username first.';
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Invalid email or password.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled.';
  }

  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google popup. Please allow popups and try again.';
  }

  if (message === 'GOOGLE_SIGN_IN_CANCELLED') {
    return 'Google sign-in was cancelled.';
  }

  if (message === 'GOOGLE_PLAY_SERVICES_NOT_AVAILABLE') {
    return 'Google Play Services is not available or needs an update on this device.';
  }

  if (message === 'GOOGLE_SIGN_IN_IN_PROGRESS') {
    return 'Google sign-in is already in progress. Please wait and try again.';
  }

  if (message === 'GOOGLE_WEB_CLIENT_ID_MISSING') {
    return 'Google sign-in is not configured yet. Add your Firebase Web Client ID in services/firebaseClient.ts.';
  }

  if (message === 'GOOGLE_ID_TOKEN_MISSING') {
    return 'Google sign-in failed to provide a token. Check your Firebase and Google OAuth configuration.';
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

export default function LoginScreen({
  onLogin,
  onGoogleLogin,
  onGoToSignUp,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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

  const clearError = () => {
    if (error) setError('');
  };

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
            {
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            },
          ]}
        >
          <View pointerEvents="none" style={styles.cardPattern}>
            <Text style={[styles.cardPatternText, styles.patternTopLeft]}>
              WI
            </Text>
            <Text style={[styles.cardPatternText, styles.patternTopRight]}>
              WI
            </Text>
            <Text style={[styles.cardPatternText, styles.patternMidLeft]}>
              WI
            </Text>
            <Text style={[styles.cardPatternText, styles.patternBottomRight]}>
              WI
            </Text>
          </View>

          <Text style={styles.cardTitle}>Login</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputIconSlot}>
              {!emailFocused && email.trim().length === 0 ? (
                <Text style={styles.inputIcon}>✉</Text>
              ) : null}
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={t => {
                setEmail(t);
                clearError();
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="Email"
              placeholderTextColor="#8E8E8E"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputIconSlot}>
              {!passwordFocused && password.trim().length === 0 ? (
                <View style={styles.lockIcon}>
                  <View style={styles.lockShackle} />
                  <View style={styles.lockBody} />
                  <View style={styles.lockHole} />
                </View>
              ) : null}
            </View>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={t => {
                setPassword(t);
                clearError();
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="Password"
              placeholderTextColor="#8E8E8E"
              secureTextEntry={!isPasswordVisible}
            />
            <Pressable
              onPress={() => setIsPasswordVisible(prev => !prev)}
              style={styles.passwordToggle}
            >
              <Text style={styles.passwordToggleText}>
                {isPasswordVisible ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>

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

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

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
              <ActivityIndicator color="#FF8C00" size="small" />
            ) : (
              <>
                <Image
                  source={{
                    uri: 'https://developers.google.com/identity/images/g-logo.png',
                  }}
                  style={styles.googleLogoImage}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
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
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#C16A00',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
  },
  cardPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  cardPatternText: {
    position: 'absolute',
    fontSize: 44,
    fontWeight: '900',
    color: '#6D3C00',
    letterSpacing: -2,
  },
  patternTopLeft: {
    top: 6,
    left: 14,
  },
  patternTopRight: {
    top: 12,
    right: 16,
  },
  patternMidLeft: {
    top: 72,
    left: 28,
  },
  patternBottomRight: {
    bottom: 58,
    right: 24,
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
  inputRow: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F5F1E6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  inputIcon: {
    fontSize: 16,
    color: '#8A8A8A',
  },
  inputIconSlot: {
    width: 20,
    marginRight: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 0,
    backgroundColor: 'transparent',
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  lockIcon: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 7,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#8A8A8A',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  lockBody: {
    width: 12,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#8A8A8A',
  },
  lockHole: {
    position: 'absolute',
    top: 8,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#F5F1E6',
  },
  passwordToggle: {
    marginLeft: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  passwordToggleText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
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
    color: '#2C2C2C',
    fontSize: 18,
    fontWeight: '800',
  },
  orRow: {
    width: '100%',
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  orText: {
    marginHorizontal: 12,
    color: '#F7E6CB',
    fontSize: 13,
    fontWeight: '700',
  },
  link: {
    marginTop: 22,
  },
  googleButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  googleLogoImage: {
    marginRight: 12,
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#4A4A4A',
    fontSize: 17,
    fontWeight: '700',
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
