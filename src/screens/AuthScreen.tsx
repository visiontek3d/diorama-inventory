import React, { useState } from 'react';
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

export default function AuthScreen() {
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Diorama Inventory</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#7A7A7A"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#7A7A7A"
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 60,
    backgroundColor: '#111111',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 14,
  },
  btn: {
    backgroundColor: '#0086A3',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    elevation: 2,
  },
  btnDisabled: { backgroundColor: '#aaa' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#0086A3', fontSize: 14, fontWeight: '600' },
});
