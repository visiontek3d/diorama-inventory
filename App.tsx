import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { supabase } from './src/lib/supabase';
import { RootStackParamList } from './src/types';
import MigrationScreen, { isMigrationDone } from './src/screens/MigrationScreen';
import SkuListScreen from './src/screens/SkuListScreen';
import SkuDetailScreen from './src/screens/SkuDetailScreen';
import AddEditSkuScreen from './src/screens/AddEditSkuScreen';
import ScanScreen from './src/screens/ScanScreen';
import OneOffScanScreen from './src/screens/OneOffScanScreen';
import BulkImportScreen from './src/screens/BulkImportScreen';
import ConfigScreen from './src/screens/ConfigScreen';

import AuthScreen from './src/screens/AuthScreen';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) setMigrationDone(await isMigrationDone());
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) setMigrationDone(await isMigrationDone());
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3367d6" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!migrationDone && !IS_EXPO_GO) {
    return <MigrationScreen onComplete={() => setMigrationDone(true)} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#3367d6',
          headerTitleStyle: { fontWeight: '700', color: '#1a1a1a' },
        }}
      >
        <Stack.Screen
          name="SkuList"
          component={SkuListScreen}
          options={{ title: 'Diorama Inventory' }}
        />
        <Stack.Screen
          name="SkuDetail"
          component={SkuDetailScreen}
          options={{ title: '' }}
        />
        <Stack.Screen
          name="AddEditSku"
          component={AddEditSkuScreen}
          options={{ title: 'Add Diorama' }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ title: 'Scan QR Code', headerShown: false }}
        />
        <Stack.Screen
          name="OneOffScan"
          component={OneOffScanScreen}
          options={{ title: 'One Off Scan', headerShown: false }}
        />
        <Stack.Screen
          name="BulkImport"
          component={BulkImportScreen}
          options={{ title: 'Bulk Import' }}
        />
        <Stack.Screen
          name="Config"
          component={ConfigScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
