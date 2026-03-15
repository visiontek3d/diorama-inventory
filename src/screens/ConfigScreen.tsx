import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { getAllDioramas, getSetting, setSetting, updateDioramaPhoto } from '../db/database';
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
  { label: 'Navy', value: '#1e40af' },
  { label: 'Royal', value: '#2563eb' },
  { label: 'Teal', value: '#0f766e' },
  { label: 'Green', value: '#166534' },
  { label: 'Purple', value: '#6d28d9' },
  { label: 'Red', value: '#b91c1c' },
  { label: 'Orange', value: '#c2410c' },
  { label: 'Gold', value: '#b45309' },
];

export const DEFAULT_CARRY_STOCK_COLOR = '#e8e8e8';

export default function ConfigScreen({ navigation }: Props) {
  const [desiredStock, setDesiredStock] = useState('');
  const [carryStockColor, setCarryStockColor] = useState(DEFAULT_CARRY_STOCK_COLOR);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    (async () => {
      const stock = await getSetting('desired_stock');
      if (stock) setDesiredStock(stock);
      const color = await getSetting('carry_stock_color');
      if (color) setCarryStockColor(color);
    })();
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

  const handleImportImages = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const total = result.assets.length;
    setImporting(true);
    setImportProgress({ current: 0, total });
    // Give React two frames to render the modal before any heavy work
    await new Promise((r) => setTimeout(r, 150));

    const dioramas = await getAllDioramas();
    const descMap = new Map<string, typeof dioramas[0]>();
    for (const d of dioramas.filter((d) => d.description.trim())) {
      const base = d.description.trim().toLowerCase();
      descMap.set(base, d);
      descMap.set(base.replace(/ /g, '-'), d);
      descMap.set(base.replace(/ /g, '_'), d);
    }


    let matched = 0;
    let skipped = 0;
    const unmatched: string[] = [];

    for (let i = 0; i < total; i++) {
      const asset = result.assets[i];
      const nameWithoutExt = asset.name.replace(/\.[^.]+$/, '').trim().toLowerCase();
      const diorama = descMap.get(nameWithoutExt);
      if (diorama) {
        try {
          await updateDioramaPhoto(diorama.sku, asset.uri);
          matched++;
        } catch (e: any) {
          setImporting(false);
          Alert.alert('Upload Error', e?.message ?? String(e));
          return;
        }
      } else {
        skipped++;
        if (unmatched.length < 5) unmatched.push(asset.name);
      }
      setImportProgress({ current: i + 1, total });
      await new Promise((r) => setTimeout(r, 0));
    }

    setImporting(false);

    const unmatchedNote = unmatched.length
      ? `\n\nNo match for: ${unmatched.join(', ')}${skipped > unmatched.length ? ` and ${skipped - unmatched.length} more` : ''}`
      : '';
    Alert.alert(
      'Image Import Complete',
      `Matched: ${matched}\nUnmatched: ${skipped}${unmatchedNote}`
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
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
          <Text style={styles.sectionTitle}>Import Images</Text>
          <Text style={styles.hint}>
            Select multiple images at once. Any image whose filename (without extension) matches a diorama's Description will have its photo set automatically.
          </Text>
          <Pressable style={[styles.actionBtn, importing && styles.actionBtnDisabled]} onPress={handleImportImages} disabled={importing}>
            <Text style={styles.actionBtnText}>Select Images to Import</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dioramas</Text>
          <Pressable
            style={[styles.actionBtn, { marginBottom: 10 }]}
            onPress={() => navigation.navigate('AddEditSku', {})}
          >
            <Text style={styles.actionBtnText}>+ Add Diorama</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => navigation.navigate('BulkImport')}
          >
            <Text style={styles.actionBtnText}>Import from CSV</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Carry Stock Highlight Color</Text>
          <Text style={styles.hint}>
            Background color for dioramas with Carry Stock enabled on the main screen.
          </Text>
          <View style={styles.colorGrid}>
            {CARRY_STOCK_COLORS.map((c) => {
              const isDark = parseInt(c.value.slice(1), 16) < 0x888888;
              const textColor = isDark ? '#fff' : '#333';
              return (
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
                    <Text style={[styles.colorSwatchCheck, { color: textColor }]}>✓</Text>
                  )}
                  <Text style={[styles.colorSwatchLabel, { color: textColor }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleSignOut}>
            <Text style={styles.actionBtnText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            Version {Constants.expoConfig?.version ?? '—'}
          </Text>
        </View>
      </ScrollView>
      {importing && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color="#3367d6" />
            <Text style={styles.overlayTitle}>Importing Images…</Text>
            <Text style={styles.overlayProgress}>
              {importProgress.current} of {importProgress.total}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: importProgress.total > 0
                      ? `${Math.round((importProgress.current / importProgress.total) * 100)}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}
    </View>
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
  actionBtn: {
    backgroundColor: '#3367d6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnSecondary: { backgroundColor: '#555' },
  actionBtnDisabled: { backgroundColor: '#aaa' },
  actionBtnDanger: { backgroundColor: '#c62828' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: 260,
    gap: 12,
    elevation: 8,
  },
  overlayTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  overlayProgress: { fontSize: 14, color: '#555' },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3367d6',
    borderRadius: 4,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: { fontSize: 13, color: '#aaa' },
});
