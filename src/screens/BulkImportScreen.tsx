import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { bulkImportDioramas } from '../db/database';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BulkImport'>;

type PreviewRow = {
  sku: string;
  description: string;
  walls: number;
  open_door: number;
  lift: number;
  error?: string;
};

export default function BulkImportScreen({ navigation }: Props) {
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setFileName(asset.name);

      const response = await fetch(asset.uri);
      const content = await response.text();

      if (!content || !content.trim()) {
        Alert.alert('Empty File', 'The selected file appears to be empty.');
        return;
      }

      const rows = parseCSV(content);

      if (rows.length === 0) {
        Alert.alert(
          'No Data Found',
          'Could not parse any rows from the file.\n\nMake sure the file has a header row and at least one data row, separated by commas.\n\nFirst few characters of file:\n' +
            content.substring(0, 100)
        );
        return;
      }

      setPreview(rows);
    } catch (e: any) {
      Alert.alert('Error Reading File', e.message ?? 'Unknown error');
    }
  };

  const handleImport = async () => {
    const validRows = preview.filter((r) => !r.error);
    if (validRows.length === 0) {
      Alert.alert('No valid rows to import');
      return;
    }

    Alert.alert(
      'Confirm Import',
      `Import ${validRows.length} diorama${validRows.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setImporting(true);
            try {
              const result = await bulkImportDioramas(validRows);
              Alert.alert(
                'Import Complete',
                `Added: ${result.inserted}\nSkipped (already exist): ${result.skipped}${result.errors.length ? `\nErrors: ${result.errors.join(', ')}` : ''}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (e: any) {
              Alert.alert('Import Failed', e.message ?? 'Unknown error');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  const validCount = preview.filter((r) => !r.error).length;
  const errorCount = preview.filter((r) => !!r.error).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>CSV Format</Text>
        <Text style={styles.infoText}>
          First row must be a header. Walls/OpenDoor/Lift are optional (default 0):
        </Text>
        <Text style={styles.code}>SKU,Description,Walls,OpenDoor,Lift</Text>
        <Text style={styles.code}>DIO-001,Village scene,10,5,3</Text>
      </View>

      <Pressable style={styles.pickBtn} onPress={handlePick}>
        <Text style={styles.pickBtnText}>
          {fileName ? `Change File (${fileName})` : 'Pick CSV File'}
        </Text>
      </Pressable>

      {preview.length > 0 && (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {validCount} valid  •  {errorCount} error{errorCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {preview.map((item, i) => (
            <View key={i} style={[styles.row, item.error ? styles.rowError : undefined]}>
              <View style={styles.rowMain}>
                <Text style={styles.rowSku}>{item.sku || '(no SKU)'}</Text>
                {item.description ? (
                  <Text style={styles.rowDesc} numberOfLines={1}>{item.description}</Text>
                ) : null}
                {item.error ? (
                  <Text style={styles.rowErrorText}>{item.error}</Text>
                ) : null}
              </View>
              {!item.error && (
                <View style={styles.rowBadges}>
                  <Text style={styles.badge}>W:{item.walls}</Text>
                  <Text style={styles.badge}>D:{item.open_door}</Text>
                  <Text style={styles.badge}>L:{item.lift}</Text>
                </View>
              )}
            </View>
          ))}

          <Pressable
            style={[styles.importBtn, (validCount === 0 || importing) && styles.importBtnDisabled]}
            onPress={handleImport}
            disabled={validCount === 0 || importing}
          >
            <Text style={styles.importBtnText}>
              {importing ? 'Importing…' : `Import ${validCount} Diorama${validCount !== 1 ? 's' : ''}`}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function parseCSV(content: string): PreviewRow[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  const dataLines = lines.slice(1);
  const rows: PreviewRow[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = splitCSVLine(line);
    const sku = cols[0]?.trim().toUpperCase();

    if (!sku) {
      rows.push({ sku: '', description: '', walls: 0, open_door: 0, lift: 0, error: 'Missing SKU' });
      continue;
    }

    rows.push({
      sku,
      description: cols[1]?.trim() ?? '',
      walls: parseQty(cols[2]),
      open_door: parseQty(cols[3]),
      lift: parseQty(cols[4]),
    });
  }

  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseQty(val?: string): number {
  const n = parseInt(val ?? '0', 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  infoCard: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  infoTitle: { fontWeight: '700', fontSize: 14, color: '#1a1a1a', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#555', marginBottom: 8 },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    backgroundColor: '#f0f0f0',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  pickBtn: {
    backgroundColor: '#3367d6',
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  pickBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  summary: { marginHorizontal: 12, marginTop: 16, marginBottom: 8 },
  summaryText: { fontSize: 13, color: '#555', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  rowError: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#f5c6c6' },
  rowMain: { flex: 1 },
  rowSku: { fontWeight: '700', fontSize: 14, color: '#1a1a1a' },
  rowDesc: { fontSize: 12, color: '#555', marginTop: 2 },
  rowErrorText: { fontSize: 12, color: '#c62828', marginTop: 2 },
  rowBadges: { flexDirection: 'row', gap: 4 },
  badge: {
    fontSize: 11,
    color: '#3367d6',
    fontWeight: '600',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importBtn: {
    backgroundColor: '#1a8a3a',
    margin: 12,
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  importBtnDisabled: { backgroundColor: '#aaa' },
  importBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
