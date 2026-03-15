import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { adjustOneOffInventory, getDiorama } from '../db/database';
import { Diorama, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'OneOffScan'>;
type Stage = 'scanning' | 'confirm';

export default function OneOffScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>('scanning');
  const [diorama, setDiorama] = useState<Diorama | null>(null);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [liftQty, setLiftQty] = useState('0');
  const [odQty, setOdQty] = useState('0');
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    const sku = data.trim().toUpperCase();
    const found = await getDiorama(sku);

    if (!found) {
      Alert.alert(
        'SKU Not Found',
        `"${sku}" is not in your inventory.`,
        [
          { text: 'Scan Again', onPress: () => { scannedRef.current = false; } },
          { text: 'Cancel', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    setDiorama(found);
    setStage('confirm');
  };

  const resetScan = () => {
    scannedRef.current = false;
    setDiorama(null);
    setStage('scanning');
    setLiftQty('0');
    setOdQty('0');
    setDirection('in');
  };

  const handleConfirm = async () => {
    if (!diorama) return;

    const lift = parseInt(liftQty, 10) || 0;
    const od = parseInt(odQty, 10) || 0;

    if (lift === 0 && od === 0) {
      Alert.alert('No quantities entered', 'Enter a quantity for at least one version.');
      return;
    }

    const sign = direction === 'in' ? 1 : -1;
    try {
      await adjustOneOffInventory(diorama.sku, lift, od, sign);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update inventory.');
      return;
    }

    const parts = [
      lift > 0 ? `${lift} × Lift Version` : '',
      od > 0 ? `${od} × Open Door Version` : '',
    ].filter(Boolean).join('\n');

    Alert.alert(
      'Done',
      `${direction === 'in' ? 'Added' : 'Removed'} for ${diorama.sku}:\n${parts}`,
      [
        { text: 'Scan Another', onPress: resetScan },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]
    );
  };

  if (!permission) return <View style={styles.center}><Text>Requesting camera...</Text></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is required to scan QR codes.</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === 'scanning') {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcode}
        />
        <View style={styles.overlay}>
          <Text style={styles.modeLabel}>ONE OFF SCAN</Text>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Point camera at a QR code</Text>
        </View>
        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.confirmContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.confirmSku}>{diorama?.sku}</Text>
      {diorama?.description ? (
        <Text style={styles.confirmDesc}>{diorama.description}</Text>
      ) : null}

      <Text style={styles.fieldLabel}>Direction</Text>
      <View style={styles.pillRow}>
        {(['in', 'out'] as const).map((d) => (
          <Pressable
            key={d}
            style={[styles.pill, direction === d && (d === 'in' ? styles.pillIn : styles.pillOut)]}
            onPress={() => setDirection(d)}
          >
            <Text style={[styles.pillText, direction === d && styles.pillTextActive]}>
              {d === 'in' ? 'Scan In' : 'Scan Out'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>One Off Quantities</Text>
      <View style={styles.card}>
        {[
          { label: 'Lift Version', value: liftQty, setter: setLiftQty },
          { label: 'Open Door Version', value: odQty, setter: setOdQty },
        ].map(({ label, value, setter }) => (
          <View key={label} style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>{label}</Text>
            <View style={styles.qtyControls}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setter(String(Math.max(0, (parseInt(value) || 0) - 1)))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </Pressable>
              <TextInput
                style={styles.qtyInput}
                value={value}
                onChangeText={setter}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setter(String((parseInt(value) || 0) + 1))}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmBtnText}>Confirm</Text>
      </Pressable>

      <Pressable style={styles.rescanBtn} onPress={resetScan}>
        <Text style={styles.rescanBtnText}>Scan Again</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  permText: { fontSize: 15, color: '#333', textAlign: 'center', marginBottom: 16 },
  permBtn: { backgroundColor: '#3367d6', padding: 14, borderRadius: 8 },
  permBtnText: { color: '#fff', fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  modeLabel: {
    color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1,
    backgroundColor: 'rgba(100,60,180,0.75)', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginBottom: 24,
  },
  scanFrame: {
    width: 240, height: 240,
    borderWidth: 2, borderColor: '#fff', borderRadius: 12, backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#fff', marginTop: 20, fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  cancelBtn: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24, borderWidth: 1, borderColor: '#fff',
  },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  confirmContainer: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 60 },
  confirmSku: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  confirmDesc: { fontSize: 14, color: '#555', marginBottom: 8 },
  fieldLabel: {
    fontSize: 12, color: '#888', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 16,
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ccc', backgroundColor: '#fff',
  },
  pillIn: { backgroundColor: '#1a8a3a', borderColor: '#1a8a3a' },
  pillOut: { backgroundColor: '#c62828', borderColor: '#c62828' },
  pillText: { color: '#333', fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 10, elevation: 1, marginTop: 4, overflow: 'hidden' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  qtyLabel: { flex: 1, fontSize: 15, color: '#333' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#ede9fe',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, color: '#6d28d9', fontWeight: '700', lineHeight: 24 },
  qtyInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 6,
    fontSize: 18, fontWeight: '700', color: '#1a1a1a',
    backgroundColor: '#fafafa', textAlign: 'center', width: 56,
  },
  confirmBtn: {
    backgroundColor: '#6d28d9', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 24, elevation: 2,
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rescanBtn: { alignItems: 'center', marginTop: 14, padding: 10 },
  rescanBtnText: { color: '#6d28d9', fontWeight: '600', fontSize: 15 },
});
