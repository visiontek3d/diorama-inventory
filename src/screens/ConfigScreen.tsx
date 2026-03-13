import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getSetting, setSetting } from '../db/database';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Config'>;

const CARRY_STOCK_COLORS: { label: string; value: string }[] = [
  { label: 'Silver', value: '#e8e8e8' },
  { label: 'Stone', value: '#d6d3d1' },
  { label: 'Slate', value: '#cbd5e1' },
  { label: 'Cool Gray', value: '#d1d5db' },
  { label: 'Sky', value: '#e0f2fe' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Indigo', value: '#e0e7ff' },
  { label: 'Steel', value: '#bfdbfe' },
];

export const DEFAULT_CARRY_STOCK_COLOR = '#e8e8e8';

export default function ConfigScreen({ navigation }: Props) {
  const [desiredStock, setDesiredStock] = useState('');
  const [carryStockColor, setCarryStockColor] = useState(DEFAULT_CARRY_STOCK_COLOR);

  useEffect(() => {
    const stock = getSetting('desired_stock');
    if (stock) setDesiredStock(stock);
    const color = getSetting('carry_stock_color');
    if (color) setCarryStockColor(color);
  }, []);

  const handleDesiredStockChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setDesiredStock(numeric);
    setSetting('desired_stock', numeric);
  };

  const handleColorSelect = (color: string) => {
    setCarryStockColor(color);
    setSetting('carry_stock_color', color);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Stock Targets</Text>
        <Text style={styles.label}>Desired Stock</Text>
        <Text style={styles.hint}>
          Target quantity for Walls. Open Door and Lift use half this value.
        </Text>
        <TextInput
          style={styles.input}
          value={desiredStock}
          onChangeText={handleDesiredStockChange}
          keyboardType="numeric"
          placeholder="Enter a number"
          placeholderTextColor="#aaa"
          selectTextOnFocus
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Carry Stock Highlight Color</Text>
        <Text style={styles.hint}>
          Background color for dioramas with Carry Stock enabled on the main screen.
        </Text>
        <View style={styles.colorGrid}>
          {CARRY_STOCK_COLORS.map((c) => (
            <Pressable
              key={c.value}
              style={[
                styles.colorSwatch,
                { backgroundColor: c.value },
                carryStockColor === c.value && styles.colorSwatchSelected,
              ]}
              onPress={() => handleColorSelect(c.value)}
            >
              {carryStockColor === c.value && (
                <Text style={styles.colorSwatchCheck}>✓</Text>
              )}
              <Text style={styles.colorSwatchLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    width: 120,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  colorSwatch: {
    width: 72,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  colorSwatchSelected: {
    borderColor: '#1a1a1a',
    borderWidth: 2.5,
  },
  colorSwatchCheck: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  colorSwatchLabel: { fontSize: 11, color: '#333', fontWeight: '600' },
});
