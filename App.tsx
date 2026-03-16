import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { supabase } from './src/lib/supabase';
import { RootStackParamList } from './src/types';
import { darkColors, lightColors } from './src/lib/theme';
import MigrationScreen, { isMigrationDone } from './src/screens/MigrationScreen';
import HomeScreen from './src/screens/HomeScreen';
import SkuListScreen from './src/screens/SkuListScreen';
import SkuDetailScreen from './src/screens/SkuDetailScreen';
import AddEditSkuScreen from './src/screens/AddEditSkuScreen';
import ScanScreen from './src/screens/ScanScreen';
import OneOffScanScreen from './src/screens/OneOffScanScreen';
import BulkImportScreen from './src/screens/BulkImportScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import LiftListScreen from './src/screens/LiftListScreen';
import LiftScanScreen from './src/screens/LiftScanScreen';
import LiftColorScreen from './src/screens/LiftColorScreen';
import LiftColorAddEditScreen from './src/screens/LiftColorAddEditScreen';
import AuthScreen from './src/screens/AuthScreen';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? darkColors : lightColors;
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
        <ActivityIndicator size="large" color={C.accent} />
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
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#0086A3',
          headerTitleStyle: { fontWeight: '700', color: '#ffffff' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
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
        <Stack.Screen
          name="LiftList"
          component={LiftListScreen}
          options={{ title: 'Lift Inventory' }}
        />
        <Stack.Screen
          name="LiftScan"
          component={LiftScanScreen}
          options={{ title: 'Lift Scan', headerShown: false }}
        />
        <Stack.Screen
          name="LiftColorSettings"
          component={LiftColorScreen}
          options={{ title: 'Color Settings' }}
        />
        <Stack.Screen
          name="LiftColorAddEdit"
          component={LiftColorAddEditScreen}
          options={({ route }) => ({
            title: route.params?.colorId ? 'Edit Color' : 'Add Color',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
