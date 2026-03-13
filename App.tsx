import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import SkuListScreen from './src/screens/SkuListScreen';
import SkuDetailScreen from './src/screens/SkuDetailScreen';
import AddEditSkuScreen from './src/screens/AddEditSkuScreen';
import ScanScreen from './src/screens/ScanScreen';
import BulkImportScreen from './src/screens/BulkImportScreen';
import ConfigScreen from './src/screens/ConfigScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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
