import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const MIGRATION_KEY = 'supabase_migration_done';

export async function isMigrationDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(MIGRATION_KEY);
  return val === 'true';
}

export async function markMigrationDone(): Promise<void> {
  await AsyncStorage.setItem(MIGRATION_KEY, 'true');
}

type Status = 'checking' | 'needed' | 'running' | 'done' | 'skipped' | 'error';

export default function MigrationScreen({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<Status>('checking');
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    checkLocalData();
  }, []);

  const checkLocalData = async () => {
    try {
      const db = SQLite.openDatabaseSync('diorama.db');
      const rows = db.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM dioramas');
      const count = rows[0]?.count ?? 0;
      setLocalCount(count);
      if (count === 0) {
        await markMigrationDone();
        setStatus('skipped');
        setTimeout(onComplete, 1000);
      } else {
        setStatus('needed');
      }
    } catch {
      // No local database exists at all
      await markMigrationDone();
      setStatus('skipped');
      setTimeout(onComplete, 800);
    }
  };

  const runMigration = async () => {
    setStatus('running');
    try {
      const db = SQLite.openDatabaseSync('diorama.db');
      const { data: { user } } = await supabase.auth.getUser();

      // ── Migrate dioramas ──────────────────────────────────────────────────
      const dioramas = db.getAllSync<any>('SELECT * FROM dioramas ORDER BY sku ASC');
      setProgress({ current: 0, total: dioramas.length, label: 'Migrating dioramas…' });

      for (let i = 0; i < dioramas.length; i++) {
        const d = dioramas[i];

        // Upload photo to Supabase Storage if it's a local file
        let photo_url: string | null = null;
        if (d.photo_uri && !d.photo_uri.startsWith('https://')) {
          try {
            const ext = d.photo_uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
            const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
            const mimeType = safeExt === 'jpg' ? 'image/jpeg' : `image/${safeExt}`;
            const fileName = `${d.sku.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${safeExt}`;
            const base64 = await FileSystem.readAsStringAsync(d.photo_uri, { encoding: 'base64' as any });
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const { error: uploadError } = await supabase.storage
              .from('diorama-photos')
              .upload(fileName, bytes, { contentType: mimeType, upsert: true });
            if (!uploadError) {
              const { data } = supabase.storage.from('diorama-photos').getPublicUrl(fileName);
              photo_url = data.publicUrl;
            }
          } catch {
            // Photo upload failed, continue without photo
          }
        } else if (d.photo_uri?.startsWith('https://')) {
          photo_url = d.photo_uri;
        }

        await supabase.from('dioramas').upsert({
          sku: d.sku,
          description: d.description ?? '',
          photo_url,
          walls_qty: d.walls_qty ?? 0,
          open_door_qty: d.open_door_qty ?? 0,
          lift_qty: d.lift_qty ?? 0,
          one_off_qty: d.one_off_qty ?? 0,
          one_off_lift_qty: d.one_off_lift_qty ?? 0,
          one_off_od_qty: d.one_off_od_qty ?? 0,
          carry_stock: !!d.carry_stock,
        }, { onConflict: 'sku' });

        setProgress({ current: i + 1, total: dioramas.length, label: 'Migrating dioramas…' });
      }

      // ── Migrate transactions ──────────────────────────────────────────────
      const transactions = db.getAllSync<any>('SELECT * FROM transactions ORDER BY created_at ASC');
      if (transactions.length > 0) {
        setProgress({ current: 0, total: transactions.length, label: 'Migrating transactions…' });
        const batches = [];
        for (let i = 0; i < transactions.length; i += 100) {
          batches.push(transactions.slice(i, i + 100));
        }
        let done = 0;
        for (const batch of batches) {
          await supabase.from('transactions').insert(
            batch.map((t: any) => ({
              sku: t.sku,
              component: t.component,
              delta: t.qty ?? t.delta ?? 0,
              user_email: user?.email ?? null,
              created_at: t.created_at,
            }))
          );
          done += batch.length;
          setProgress({ current: done, total: transactions.length, label: 'Migrating transactions…' });
        }
      }

      // ── Migrate settings ──────────────────────────────────────────────────
      if (user) {
        try {
          const desiredStock = db.getFirstSync<{ value: string }>(
            "SELECT value FROM settings WHERE key = 'desired_stock'"
          );
          const carryColor = db.getFirstSync<{ value: string }>(
            "SELECT value FROM settings WHERE key = 'carry_stock_color'"
          );
          const payload: any = { user_id: user.id };
          if (desiredStock?.value) payload.desired_stock = parseInt(desiredStock.value, 10) || 0;
          if (carryColor?.value) payload.carry_stock_color = carryColor.value;
          await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
        } catch {
          // Settings table may not exist, skip
        }
      }

      await markMigrationDone();
      setStatus('done');
      setTimeout(onComplete, 1500);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Migration failed');
      setStatus('error');
    }
  };

  const skip = async () => {
    await markMigrationDone();
    onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'checking' && (
          <>
            <ActivityIndicator size="large" color="#3367d6" />
            <Text style={styles.title}>Checking local data…</Text>
          </>
        )}

        {status === 'needed' && (
          <>
            <Text style={styles.title}>Migrate Local Data</Text>
            <Text style={styles.body}>
              {localCount} diorama{localCount !== 1 ? 's' : ''} found on this device.{'\n\n'}
              Migrate your existing inventory to the cloud so it's available to all users.
            </Text>
            <Pressable style={styles.btn} onPress={runMigration}>
              <Text style={styles.btnText}>Migrate Now</Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={skip}>
              <Text style={styles.skipText}>Skip — start fresh</Text>
            </Pressable>
          </>
        )}

        {status === 'running' && (
          <>
            <ActivityIndicator size="large" color="#3367d6" />
            <Text style={styles.title}>{progress.label}</Text>
            <Text style={styles.progress}>
              {progress.current} of {progress.total}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: progress.total > 0
                      ? `${Math.round((progress.current / progress.total) * 100)}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          </>
        )}

        {status === 'done' && (
          <>
            <Text style={styles.doneIcon}>✓</Text>
            <Text style={styles.title}>Migration Complete</Text>
            <Text style={styles.body}>Your data is now in the cloud.</Text>
          </>
        )}

        {status === 'skipped' && (
          <>
            <ActivityIndicator size="small" color="#3367d6" />
            <Text style={styles.title}>No local data found</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.errorIcon}>✕</Text>
            <Text style={styles.title}>Migration Failed</Text>
            <Text style={styles.body}>{errorMsg}</Text>
            <Pressable style={styles.btn} onPress={runMigration}>
              <Text style={styles.btnText}>Retry</Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={skip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  body: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  progress: { fontSize: 14, color: '#555' },
  progressBarBg: {
    width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#3367d6', borderRadius: 4 },
  btn: {
    backgroundColor: '#3367d6', borderRadius: 10, paddingVertical: 14,
    paddingHorizontal: 32, alignItems: 'center', marginTop: 8, width: '100%',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skipBtn: { marginTop: 4, padding: 10 },
  skipText: { color: '#888', fontSize: 14 },
  doneIcon: { fontSize: 48, color: '#1a8a3a' },
  errorIcon: { fontSize: 48, color: '#c62828' },
});
