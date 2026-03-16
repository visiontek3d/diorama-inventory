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
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAppTheme } from '../lib/theme';

export default function AuthScreen() {
  const C = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) Alert.alert('Login Failed', error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) Alert.alert('Sign Up Failed', error.message);
        else Alert.alert('Account Created', 'You are now signed in.');
      }
    } finally {
      setLoading(false);
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
