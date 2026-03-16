import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { adjustLiftInventory, getLiftColors, getLifts } from '../db/database';
import { Lift, LiftColor, RootStackParamList } from '../types';
import { useAppTheme, AppColors } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LiftList'>;
type SizeTab = '2high' | '3high';

const LOGO = require('../../assets/logo.png');

export default function LiftListScreen({ navigation }: Props) {
  const C = useAppTheme();
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, LiftColor>>({});
  const [activeTab, setActiveTab] = useState<SizeTab>('2high');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerTitle: () => (
        <View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#ffffff' }}>Lift Inventory</Text>
          {userEmail ? <Text style={{ fontSize: 11, color: '#7A7A7A', marginTop: 1 }}>{userEmail}</Text> : null}
        </View>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('LiftColorSettings')}
          style={{ marginRight: 4, padding: 4 }}
        >
          <Ionicons name="color-palette-outline" size={22} color="#0086A3" />
        </Pressable>
      ),
    });
  }, [navigation, userEmail]);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getLifts(), getLiftColors()])
      .then(([liftData, colorData]) => {
        if (!mounted) return;
        setLifts(liftData);
        const map: Record<string, LiftColor> = {};
        for (const c of colorData) map[c.name] = c;
        setColorMap(map);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useFocusEffect(load);

  const handleAdjust = async (lift: Lift, delta: 1 | -1) => {
    if (delta === -1 && lift.qty === 0) return;
    await adjustLiftInventory(lift.id, delta);
    setLifts((prev) =>
      prev.map((l) =>
        l.id === lift.id ? { ...l, qty: Math.max(0, l.qty + delta) } : l
      )
    );
  };

  const tabLifts = lifts.filter((l) => l.size === activeTab);
  const primary = tabLifts.filter((l) => l.variation === 'primary');
  const extender = tabLifts.filter((l) => l.variation === 'extender');
  const primaryTotal = primary.reduce((s, l) => s + l.qty, 0);
  const extenderTotal = extender.reduce((s, l) => s + l.qty, 0);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: '#000000',
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: C.tabActive },
    tabText: { fontSize: 14, fontWeight: '700', color: C.tabInactive },
    tabTextActive: { color: C.tabActive },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    section: {
      marginHorizontal: 12,
      marginTop: 16,
      backgroundColor: C.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.sectionHeader,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
    },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: C.sectionHeaderText, letterSpacing: 1, textTransform: 'uppercase' },
    totalBadge: {
      backgroundColor: C.badge,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignItems: 'center',
    },
    totalBadgeLabel: { fontSize: 9, color: '#e0f7fa', fontWeight: '700' },
    totalBadgeValue: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
      gap: 12,
    },
    colorThumb: { width: 36, height: 36, borderRadius: 6 },
    colorDot: { width: 36, height: 36, borderRadius: 6 },
    colorName: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
    counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    counterBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterBtnDisabled: { backgroundColor: C.separator },
    counterBtnText: { fontSize: 20, color: '#fff', fontWeight: '700', lineHeight: 24 },
    qty: { fontSize: 18, fontWeight: '700', color: C.text, minWidth: 32, textAlign: 'center' },
    fabRow: {
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
    },
    fab: {
      backgroundColor: C.accent,
      flexDirection: 'row',
      paddingVertical: 14,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  }), [C]);

  return (
    <View style={styles.container}>
      {/* Size tabs */}
      <View style={styles.tabBar}>
        {(['2high', '3high'] as SizeTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === '2high' ? '2-High' : '3-High'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <Section
            title="Primary Lift"
            lifts={primary}
            total={primaryTotal}
            colorMap={colorMap}
            onAdjust={handleAdjust}
            styles={styles}
          />
          <Section
            title="Extender"
            lifts={extender}
            total={extenderTotal}
            colorMap={colorMap}
            onAdjust={handleAdjust}
            styles={styles}
          />
        </ScrollView>
      )}

      <View style={styles.fabRow}>
        <Pressable style={styles.fab} onPress={() => navigation.navigate('LiftScan')}>
          <Ionicons name="qr-code-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Scan</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({
  title,
  lifts,
  total,
  colorMap,
  onAdjust,
  styles,
}: {
  title: string;
  lifts: Lift[];
  total: number;
  colorMap: Record<string, LiftColor>;
  onAdjust: (lift: Lift, delta: 1 | -1) => void;
  styles: ReturnType<typeof StyleSheet.create>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeLabel}>TOTAL</Text>
          <Text style={styles.totalBadgeValue}>{total}</Text>
        </View>
      </View>
      {lifts.map((lift) => {
        const colorData = colorMap[lift.color];
        return (
        <View key={lift.id} style={styles.row}>
          <View style={[styles.colorThumb, { backgroundColor: colorData?.color_hex ?? '#888' }]} />
          <Text style={styles.colorName}>{lift.color}</Text>
          <View style={styles.counter}>
            <Pressable
              style={[styles.counterBtn, lift.qty === 0 && styles.counterBtnDisabled]}
              onPress={() => onAdjust(lift, -1)}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qty}>{lift.qty}</Text>
            <Pressable style={styles.counterBtn} onPress={() => onAdjust(lift, 1)}>
              <Text style={styles.counterBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
        );
      })}
    </View>
  );
}
