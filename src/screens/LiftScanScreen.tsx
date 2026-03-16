import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { adjustLiftInventory, getLiftColors, getLifts } from '../db/database';
import { Lift, LiftColor, RootStackParamList } from '../types';
import { useAppTheme } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LiftScan'>;
type Stage = 'scanning' | 'confirm';

export default function LiftScanScreen({ navigation }: Props) {
  const C = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>('scanning');
  const [size, setSize] = useState<'2high' | '3high'>('2high');
  const [variation, setVariation] = useState<'primary' | 'extender'>('primary');
  const [allLifts, setAllLifts] = useState<Lift[]>([]);
  const [liftColors, setLiftColors] = useState<LiftColor[]>([]);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [qty, setQty] = useState(1);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // QR code format: LIFT|{size}|{variation}
  // e.g. LIFT|2high|primary
  const handleBarcode = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    const parts = data.trim().split('|');
    if (parts.length !== 3 || parts[0] !== 'LIFT') {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a lift inventory code.',
        [
          { text: 'Scan Again', onPress: () => { scannedRef.current = false; } },
          { text: 'Cancel', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    const scannedSize = parts[1] as '2high' | '3high';
    const scannedVariation = parts[2] as 'primary' | 'extender';

    try {
      const [lifts, colors] = await Promise.all([getLifts(), getLiftColors()]);
      setAllLifts(lifts);
      setLiftColors(colors);
      setSize(scannedSize);
      setVariation(scannedVariation);
      setSelectedColor('');
      setQty(1);
      setDirection('in');
      setStage('confirm');
    } catch {
      Alert.alert('Error', 'Failed to load lift data.', [
        { text: 'Try Again', onPress: () => { scannedRef.current = false; } },
      ]);
    }
  };

  const handleConfirm = async () => {
    if (!selectedColor) {
      Alert.alert('Select a Color', 'Please select a color before confirming.');
      return;
    }

    const lift = allLifts.find(
      (l) => l.size === size && l.variation === variation && l.color === selectedColor
    );

    if (!lift) {
      Alert.alert('Error', 'Could not find matching lift variant.');
      return;
    }

    const delta = (direction === 'in' ? 1 : -1) * qty;

    if (direction === 'out' && lift.qty === 0) {
      Alert.alert('Cannot Remove', `${selectedColor} quantity is already 0.`);
      return;
    }
    if (direction === 'out' && qty > lift.qty) {
      Alert.alert('Cannot Remove', `Only ${lift.qty} in stock. Cannot remove ${qty}.`);
      return;
    }

    try {
      await adjustLiftInventory(lift.id, delta);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update inventory.');
      return;
    }

    const newQty = Math.max(0, lift.qty + delta);
    const sizeLabel = size === '2high' ? '2-High' : '3-High';
    const varLabel = variation === 'primary' ? 'Primary Lift' : 'Extender';

    Alert.alert(
      'Done',
      `${direction === 'in' ? `+${qty}` : `-${qty}`} ${selectedColor} ${sizeLabel} ${varLabel}\nNew qty: ${newQty}`,
      [
        {
          text: 'Scan Another',
          onPress: () => {
            scannedRef.current = false;
            setStage('scanning');
          },
        },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]
    );
  };

  const reset = () => {
    scannedRef.current = false;
    setStage('scanning');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.background },
    permText: { fontSize: 15, color: C.textSecondary, textAlign: 'center', marginBottom: 16 },
    permBtn: { backgroundColor: C.accent, padding: 14, borderRadius: 8 },
    permBtnText: { color: '#fff', fontWeight: '700' },
    overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    scanFrame: {
      width: 240, height: 240,
      borderWidth: 2, borderColor: C.accent, borderRadius: 12,
    },
    scanHint: {
      color: '#fff', marginTop: 20, fontSize: 15,
      backgroundColor: C.scanOverlay, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    },
    cancelBtn: {
      position: 'absolute', bottom: 40, alignSelf: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 28, paddingVertical: 12,
      borderRadius: 24, borderWidth: 1, borderColor: '#fff',
    },
    cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    confirmContainer: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: '#000000',
      padding: 20,
      paddingTop: 40,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
      marginBottom: 20,
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
    headerSub: { fontSize: 15, color: C.accent, fontWeight: '600', marginTop: 2 },
    currentQtyBadge: {
      marginTop: 12,
      alignSelf: 'flex-start',
      backgroundColor: C.accent,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    currentQtyLabel: { fontSize: 10, color: '#e0f7fa', fontWeight: '700' },
    currentQtyValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
    fieldLabel: {
      fontSize: 12, color: C.textSecondary, textTransform: 'uppercase',
      letterSpacing: 0.5, marginBottom: 10, marginTop: 4, paddingHorizontal: 16,
    },
    pillRow: { flexDirection: 'row', gap: 10, marginBottom: 20, paddingHorizontal: 16 },
    pill: {
      flex: 1, paddingVertical: 12, borderRadius: 20,
      borderWidth: 1.5, borderColor: C.inputBorder, backgroundColor: C.card,
      alignItems: 'center',
    },
    pillIn: { backgroundColor: '#1a8a3a', borderColor: '#1a8a3a' },
    pillOut: { backgroundColor: C.danger, borderColor: C.danger },
    pillText: { color: C.textSecondary, fontWeight: '600', fontSize: 14 },
    pillTextActive: { color: '#fff' },
    colorGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      gap: 10, paddingHorizontal: 16, marginBottom: 20,
    },
    colorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.card,
      borderWidth: 1.5,
      borderColor: C.cardBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      width: '46%',
    },
    colorBtnSelected: {
      borderColor: C.accent,
      backgroundColor: C.sectionHeader,
    },
    colorThumb: { width: 28, height: 28, borderRadius: 6 },
    colorDot: { width: 14, height: 14, borderRadius: 7 },
    colorBtnText: { fontSize: 13, color: C.textSecondary, fontWeight: '600' },
    colorBtnTextSelected: { color: C.text },
    qtyRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 24,
      marginBottom: 28, paddingHorizontal: 16,
    },
    qtyBtn: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    },
    qtyBtnDisabled: { backgroundColor: C.separator },
    qtyBtnText: { fontSize: 24, color: '#fff', fontWeight: '700', lineHeight: 28 },
    qtyValue: { fontSize: 36, fontWeight: '800', color: C.text, minWidth: 60, textAlign: 'center' },
    confirmBtn: {
      backgroundColor: C.accent, padding: 16, borderRadius: 10,
      alignItems: 'center', marginHorizontal: 16,
    },
    confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    rescanBtn: { alignItems: 'center', marginTop: 14, padding: 10 },
    rescanBtnText: { color: C.accent, fontWeight: '600', fontSize: 15 },
  }), [C]);

  if (!permission) return <View style={styles.center}><Text style={styles.permText}>Requesting camera...</Text></View>;
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
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Point camera at a lift QR code</Text>
        </View>
        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const sizeLabel = size === '2high' ? '2-High' : '3-High';
  const varLabel = variation === 'primary' ? 'Primary Lift' : 'Extender';
  const selectedColorData = liftColors.find((c) => c.name === selectedColor);
  const selectedLift = allLifts.find(
    (l) => l.size === size && l.variation === variation && l.color === selectedColor
  );

  return (
    <ScrollView style={styles.confirmContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{sizeLabel}</Text>
        <Text style={styles.headerSub}>{varLabel}</Text>
        {selectedLift ? (
          <View style={styles.currentQtyBadge}>
            <Text style={styles.currentQtyLabel}>CURRENT QTY</Text>
            <Text style={styles.currentQtyValue}>{selectedLift.qty}</Text>
          </View>
        ) : null}
      </View>

      {/* Direction */}
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

      {/* Color selector */}
      <Text style={styles.fieldLabel}>Color</Text>
      <View style={styles.colorGrid}>
        {liftColors
          .filter((c) => size === '2high' ? c.has_2high : c.has_3high)
          .map((c) => {
            const selected = selectedColor === c.name;
            return (
              <Pressable
                key={c.id}
                style={[styles.colorBtn, selected && styles.colorBtnSelected]}
                onPress={() => setSelectedColor(c.name)}
              >
                <View style={[styles.colorThumb, { backgroundColor: c.color_hex }]} />
                <Text style={[styles.colorBtnText, selected && styles.colorBtnTextSelected]}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
      </View>

      {/* Qty */}
      <Text style={styles.fieldLabel}>Quantity</Text>
      <View style={styles.qtyRow}>
        <Pressable
          style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
          onPress={() => setQty(Math.max(1, qty - 1))}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{qty}</Text>
        <Pressable style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>

      <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmBtnText}>Confirm</Text>
      </Pressable>

      <Pressable style={styles.rescanBtn} onPress={reset}>
        <Text style={styles.rescanBtnText}>Scan Again</Text>
      </Pressable>
    </ScrollView>
  );
}
