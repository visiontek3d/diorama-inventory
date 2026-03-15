import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getAllDioramas, getSetting, searchDioramas } from '../db/database';
import { DEFAULT_CARRY_STOCK_COLOR } from './ConfigScreen';
import { Diorama, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SkuList'>;
type Tab = 'all' | 'in_stock' | 'restock' | 'one_off';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'restock', label: 'Restock' },
  { key: 'one_off', label: 'One Off' },
];

export default function SkuListScreen({ navigation }: Props) {
  const [dioramas, setDioramas] = useState<Diorama[]>([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [desiredStock, setDesiredStock] = useState('');
  const [carryStockColor, setCarryStockColor] = useState(DEFAULT_CARRY_STOCK_COLOR);
  const [loadingData, setLoadingData] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1a1a1a' }}>Diorama Inventory</Text>
          {userEmail ? <Text style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{userEmail}</Text> : null}
        </View>
      ),
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Config')} style={{ marginRight: 4, padding: 4 }}>
          <Ionicons name="settings-outline" size={22} color="#3367d6" />
        </Pressable>
      ),
    });
  }, [navigation, userEmail]);

  const load = useCallback(() => {
    let mounted = true;
    setLoadingData(true);
    (async () => {
      try {
        const [stock, color, data] = await Promise.all([
          getSetting('desired_stock'),
          getSetting('carry_stock_color'),
          query.trim() ? searchDioramas(query) : getAllDioramas(),
        ]);
        if (!mounted) return;
        setDesiredStock(stock ?? '');
        setCarryStockColor(color ?? DEFAULT_CARRY_STOCK_COLOR);
        setDioramas(data);
      } finally {
        if (mounted) setLoadingData(false);
      }
    })();
    return () => { mounted = false; };
  }, [query]);

  useFocusEffect(load);

  const handleSearch = (text: string) => {
    setQuery(text);
    (async () => {
      const data = text.trim() ? await searchDioramas(text) : await getAllDioramas();
      setDioramas(data);
    })();
  };

  const target = parseInt(desiredStock, 10) || 0;
  const halfTarget = Math.ceil(target / 2);

  const filtered = dioramas.filter((d) => {
    if (activeTab === 'in_stock') return d.walls_qty > 0 || d.open_door_qty > 0 || d.lift_qty > 0;
    if (activeTab === 'one_off') return (d.one_off_lift_qty ?? 0) > 0 || (d.one_off_od_qty ?? 0) > 0;
    if (activeTab === 'restock') {
      if (!d.carry_stock || target === 0) return false;
      return d.walls_qty < target || d.open_door_qty < halfTarget || d.lift_qty < halfTarget;
    }
    return true;
  });

  const emptyMessage = () => {
    if (activeTab === 'in_stock') return 'No dioramas with Walls, Open Door, or Lift in stock.';
    if (activeTab === 'one_off') return 'No dioramas with One Off inventory.';
    if (activeTab === 'restock') return target === 0 ? 'Set a Desired Stock in Settings to use this tab.' : 'All carry stock items are fully stocked.';
    return 'No dioramas found. Tap + to add one.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search SKU or description..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={handleSearch}
      />

      {loadingData ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#3367d6" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>{emptyMessage()}</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.sku}
          renderItem={({ item }) => {
            const carryStock = !!item.carry_stock;
            const isRestock = activeTab === 'restock';

            const wallsNeeded = Math.max(0, target - item.walls_qty);
            const doorNeeded = Math.max(0, halfTarget - item.open_door_qty);
            const liftNeeded = Math.max(0, halfTarget - item.lift_qty);

            return (
              <Pressable
                style={[styles.row, carryStock && activeTab !== 'one_off' && { borderWidth: 2, borderColor: carryStockColor }]}
                onPress={() => navigation.navigate('SkuDetail', { sku: item.sku })}
              >
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.thumbnailPlaceholder} />
                )}
                <View style={styles.rowText}>
                  <Text style={styles.sku}>{item.sku}</Text>
                  {item.description ? (
                    <Text style={styles.desc} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                  {isRestock && (
                    <Text style={styles.restockHint}>Needed to reach target</Text>
                  )}
                </View>
                {activeTab === 'one_off' ? (
                  <View style={styles.badges}>
                    <Badge label="LV" value={item.one_off_lift_qty ?? 0} />
                    <Badge label="OD" value={item.one_off_od_qty ?? 0} />
                  </View>
                ) : isRestock ? (
                  <View style={styles.badges}>
                    <Badge label="W" value={wallsNeeded} restock={wallsNeeded > 0} />
                    <Badge label="D" value={doorNeeded} restock={doorNeeded > 0} />
                    <Badge label="L" value={liftNeeded} restock={liftNeeded > 0} />
                  </View>
                ) : (
                  <View style={styles.badges}>
                    <Badge
                      label="W"
                      value={item.walls_qty}
                      alert={carryStock && target > 0 && item.walls_qty < target}
                    />
                    <Badge
                      label="D"
                      value={item.open_door_qty}
                      alert={carryStock && target > 0 && item.open_door_qty < halfTarget}
                    />
                    <Badge
                      label="L"
                      value={item.lift_qty}
                      alert={carryStock && target > 0 && item.lift_qty < halfTarget}
                    />
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {activeTab === 'in_stock' && filtered.length > 0 && (() => {
        const totalW = filtered.reduce((sum, d) => sum + d.walls_qty, 0);
        const totalD = filtered.reduce((sum, d) => sum + d.open_door_qty, 0);
        const totalL = filtered.reduce((sum, d) => sum + d.lift_qty, 0);
        return (
          <View style={[styles.totalsBar, { justifyContent: 'flex-end' }]}>
            <View style={styles.badges}>
              <Badge label="W" value={totalW} />
              <Badge label="D" value={totalD} />
              <Badge label="L" value={totalL} />
            </View>
          </View>
        );
      })()}

      {activeTab === 'one_off' && filtered.length > 0 && (() => {
        const totalLV = filtered.reduce((sum, d) => sum + (d.one_off_lift_qty ?? 0), 0);
        const totalOD = filtered.reduce((sum, d) => sum + (d.one_off_od_qty ?? 0), 0);
        return (
          <View style={[styles.totalsBar, { justifyContent: 'flex-end' }]}>
            <Badge label="TOTAL" value={totalLV + totalOD} />
          </View>
        );
      })()}

      <View style={styles.fab_row}>
        {activeTab === 'one_off' ? (
          <Pressable
            style={[styles.fab, styles.fabOneOff]}
            onPress={() => navigation.navigate('OneOffScan')}
          >
            <Text style={styles.fabText}>Scan One Off</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.fab}
            onPress={() => navigation.navigate('Scan')}
          >
            <Text style={styles.fabText}>Scan</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Badge({
  label,
  value,
  alert = false,
  restock = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
  restock?: boolean;
}) {
  return (
    <View style={[styles.badge, alert && styles.badgeAlert, restock && styles.badgeRestock]}>
      <Text style={[styles.badgeLabel, alert && styles.badgeLabelAlert, restock && styles.badgeLabelRestock]}>
        {label}
      </Text>
      <Text style={[styles.badgeValue, alert && styles.badgeValueAlert, restock && styles.badgeValueRestock]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#3367d6' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#3367d6' },
  settingsBtn: { color: '#3367d6', fontSize: 15, fontWeight: '600' },
  search: {
    margin: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 15,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 10,
    elevation: 1,
    gap: 10,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  rowText: { flex: 1 },
  sku: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  desc: { fontSize: 13, color: '#555', marginTop: 2 },
  restockHint: { fontSize: 11, color: '#b45309', marginTop: 3, fontWeight: '600' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: {
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
  },
  badgeLabel: { fontSize: 10, color: '#3367d6', fontWeight: '600' },
  badgeValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  badgeAlert: { backgroundColor: '#c62828' },
  badgeLabelAlert: { color: '#ffcccc' },
  badgeValueAlert: { color: '#fff' },
  badgeRestock: { backgroundColor: '#fef3c7' },
  badgeLabelRestock: { color: '#b45309' },
  badgeValueRestock: { color: '#92400e' },
  totalsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    borderTopWidth: 2,
    borderTopColor: '#6d28d9',
  },
  totalsLabel: { fontSize: 13, fontWeight: '700', color: '#6d28d9' },
  empty: { textAlign: 'center', color: '#888', fontSize: 15 },
  emptyContainer: { flex: 1, paddingTop: 80, alignItems: 'center', paddingHorizontal: 24 },
  fab_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 16,
  },
  fab: {
    flex: 1,
    backgroundColor: '#3367d6',
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
    alignItems: 'center',
  },
  fabSecondary: { backgroundColor: '#555' },
  fabOneOff: { backgroundColor: '#6d28d9' },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
