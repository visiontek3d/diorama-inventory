import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getLiftColors } from '../db/database';
import { LiftColor, RootStackParamList } from '../types';
import { useAppTheme } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LiftColorSettings'>;

export default function LiftColorScreen({ navigation }: Props) {
  const C = useAppTheme();
  const [colors, setColors] = useState<LiftColor[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    getLiftColors()
      .then((data) => { if (mounted) setColors(data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useFocusEffect(load);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, paddingTop: 80, alignItems: 'center' },
    empty: { color: C.textSecondary, fontSize: 15 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.card,
      marginHorizontal: 12,
      marginTop: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
      gap: 12,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 8,
    },
    thumbPlaceholder: {
      backgroundColor: C.separator,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorDot: { width: 24, height: 24, borderRadius: 12 },
    info: { flex: 1, gap: 6 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hexDot: { width: 14, height: 14, borderRadius: 7 },
    name: { fontSize: 16, fontWeight: '700', color: C.text },
    badges: { flexDirection: 'row', gap: 6 },
    badge: {
      backgroundColor: C.badge,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
  }), [C]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={colors}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('LiftColorAddEdit', { colorId: item.id })}
            >
              <View style={[styles.thumb, { backgroundColor: item.color_hex }]} />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                <View style={styles.badges}>
                  {item.has_2high && <View style={styles.badge}><Text style={styles.badgeText}>2-High</Text></View>}
                  {item.has_3high && <View style={styles.badge}><Text style={styles.badgeText}>3-High</Text></View>}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No colors yet. Tap + to add one.</Text>
            </View>
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('LiftColorAddEdit', {})}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
