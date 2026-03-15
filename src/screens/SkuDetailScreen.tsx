import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { adjustInventory, deleteDiorama, getDiorama, getTransactions } from '../db/database';
import { Component, COMPONENT_LABELS, Diorama, RootStackParamList, Transaction } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SkuDetail'>;

const COMPONENTS: Component[] = ['walls', 'open_door', 'lift'];

export default function SkuDetailScreen({ route, navigation }: Props) {
  const { sku } = route.params;
  const [diorama, setDiorama] = useState<Diorama | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const load = useCallback(() => {
    let mounted = true;
    (async () => {
      const d = await getDiorama(sku);
      if (!mounted) return;
      if (!d) { navigation.goBack(); return; }
      setDiorama(d);
      const txs = await getTransactions(sku);
      if (mounted) setTransactions(txs);
    })();
    return () => { mounted = false; };
  }, [sku]);

  useFocusEffect(load);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: sku,
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('AddEditSku', { sku })} style={{ marginRight: 4 }}>
          <Text style={styles.headerBtn}>Edit</Text>
        </Pressable>
      ),
    });
  }, [navigation, sku]);

  const handleDelete = () => {
    Alert.alert('Delete Diorama', `Delete ${sku} and all its inventory data?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDiorama(sku);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleAdjust = async (component: Component, direction: 1 | -1) => {
    await adjustInventory(sku, component, direction);
    load();
  };

  if (!diorama) return null;

  const qtyMap: Record<Component, number> = {
    walls: diorama.walls_qty,
    open_door: diorama.open_door_qty,
    lift: diorama.lift_qty,
    one_off: diorama.one_off_qty,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {diorama.photo_url ? (
        <Image source={{ uri: diorama.photo_url }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>No photo</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>SKU</Text>
        <Text style={styles.value}>{diorama.sku}</Text>
        {diorama.description ? (
          <>
            <Text style={[styles.label, { marginTop: 12 }]}>Description</Text>
            <Text style={styles.value}>{diorama.description}</Text>
          </>
        ) : null}
        <View style={styles.carryStockRow}>
          <View style={[styles.carryStockBox, !!diorama.carry_stock && styles.carryStockBoxChecked]}>
            {!!diorama.carry_stock ? <Text style={styles.carryStockCheck}>✓</Text> : null}
          </View>
          <Text style={styles.carryStockLabel}>Carry Stock</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        {COMPONENTS.map((comp) => (
          <View key={comp} style={styles.inventoryRow}>
            <Text style={styles.compLabel}>{COMPONENT_LABELS[comp]}</Text>
            <View style={styles.counter}>
              <Pressable style={styles.counterBtn} onPress={() => handleAdjust(comp, -1)}>
                <Text style={styles.counterBtnText}>-</Text>
              </Pressable>
              <Text style={styles.counterValue}>{qtyMap[comp]}</Text>
              <Pressable style={styles.counterBtn} onPress={() => handleAdjust(comp, 1)}>
                <Text style={styles.counterBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {transactions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {transactions.slice(0, 10).map((t) => (
            <View key={t.id} style={styles.txRow}>
              <Text style={styles.txLabel}>{COMPONENT_LABELS[t.component]}</Text>
              <Text style={[styles.txQty, t.delta > 0 ? styles.txIn : styles.txOut]}>
                {t.delta > 0 ? `+${t.delta}` : t.delta}
              </Text>
              {t.user_email ? (
                <Text style={styles.txUser}>{t.user_email.split('@')[0]}</Text>
              ) : null}
              <Text style={styles.txDate}>{formatDate(t.created_at)}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Delete Diorama</Text>
      </Pressable>
    </ScrollView>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  photo: { width: '100%', height: 340 },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { color: '#888', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  label: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, color: '#1a1a1a', marginTop: 2 },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  compLabel: { flex: 1, fontSize: 15, color: '#333' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: { fontSize: 20, color: '#3367d6', fontWeight: '700', lineHeight: 24 },
  counterValue: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', minWidth: 30, textAlign: 'center' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  txLabel: { flex: 1, fontSize: 14, color: '#333' },
  txQty: { fontSize: 14, fontWeight: '700', marginRight: 8 },
  txIn: { color: '#1a8a3a' },
  txOut: { color: '#c62828' },
  txUser: { fontSize: 11, color: '#888', marginRight: 8 },
  txDate: { fontSize: 12, color: '#888' },
  deleteBtn: {
    margin: 12,
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#c62828',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#c62828', fontWeight: '700', fontSize: 15 },
  headerBtn: { color: '#3367d6', fontSize: 16 },
  carryStockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  carryStockBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3367d6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carryStockBoxChecked: { backgroundColor: '#3367d6' },
  carryStockCheck: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17 },
  carryStockLabel: { fontSize: 15, color: '#333' },
});
