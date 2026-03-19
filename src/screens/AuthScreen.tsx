import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAppTheme } from '../lib/theme';

const WEB_CLIENT_ID = '173807542780-tjujh515tenagrk4fkkkusktba9n19cg.apps.googleusercontent.com';

// Show Google Sign-In only in sideloaded APK, not in Expo Go dev
const isStandalone = Constants.executionEnvironment !== 'storeClient';

if (isStandalone) {
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
}

export default function AuthScreen() {
  const C = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) Alert.alert('Login Failed', error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) Alert.alert('Sign Up Failed', error.message);
        else Alert.alert('Account Created', 'You are now signed in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token returned from Google.');
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error) Alert.alert('Google Sign-In Failed', error.message);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled, do nothing
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // already signing in
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available.');
      } else {
        Alert.alert('Google Sign-In Error', error.message ?? 'Unknown error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 60,
      backgroundColor: C.background,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: C.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: C.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    input: {
      backgroundColor: C.input,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 10,
      padding: 14,
      fontSize: 15,
      color: C.inputText,
      marginBottom: 14,
    },
    btn: {
      backgroundColor: C.accent,
      borderRadius: 10,
      padding: 16,
      alignItems: 'center',
      marginTop: 4,
      elevation: 2,
    },
    btnDisabled: { backgroundColor: '#aaa' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: C.inputBorder,
    },
    dividerText: {
      color: C.textSecondary,
      fontSize: 13,
    },
    googleBtn: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: '#ddd',
      elevation: 1,
    },
    googleBtnDisabled: { opacity: 0.6 },
    googleIcon: {
      width: 20,
      height: 20,
      borderRadius: 2,
    },
    googleBtnText: {
      color: '#3c4043',
      fontWeight: '600',
      fontSize: 15,
    },
    switchBtn: { marginTop: 20, alignItems: 'center' },
    switchText: { color: C.accent, fontSize: 14, fontWeight: '600' },
  }), [C]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>VisionTek3D</Text>
        <Text style={[styles.subtitle, { marginBottom: 4, color: C.accent }]}>Inventory Management</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={C.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={C.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </Pressable>

        {isStandalone && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  {/* Google "G" logo */}
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4', lineHeight: 20 }}>G</Text>
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </Pressable>
          </>
        )}

        <Pressable
          style={styles.switchBtn}
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
