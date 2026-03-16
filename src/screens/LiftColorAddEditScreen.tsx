import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { createLiftColor, deleteLiftColor, getLiftColors, updateLiftColor } from '../db/database';
import { LiftColor, RootStackParamList } from '../types';
import { useAppTheme } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LiftColorAddEdit'>;

const PRESET_COLORS = [
  '#E53935', '#FDD835', '#1E88E5', '#9E9E9E',
  '#8E24AA', '#3949AB', '#43A047', '#00ACC1',
  '#FF6F00', '#F4511E', '#00897B', '#039BE5',
  '#C62828', '#AD1457', '#1565C0', '#2E7D32',
];

export default function LiftColorAddEditScreen({ route, navigation }: Props) {
  const C = useAppTheme();
  const colorId = route.params?.colorId;
  const isEdit = !!colorId;

  const [original, setOriginal] = useState<LiftColor | null>(null);
  const [name, setName] = useState('');
  const [has2high, setHas2high] = useState(true);
  const [has3high, setHas3high] = useState(true);
  const [colorHex, setColorHex] = useState('#0086A3');
  const [hexInput, setHexInput] = useState('#0086A3');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!colorId) return;
    getLiftColors().then((colors) => {
      const found = colors.find((c) => c.id === colorId);
      if (!found) return;
      setOriginal(found);
      setName(found.name);
      setHas2high(found.has_2high);
      setHas3high(found.has_3high);
      setColorHex(found.color_hex);
      setHexInput(found.color_hex);
    });
  }, [colorId]);

  const handleHexChange = (text: string) => {
    setHexInput(text);
    if (/^#[0-9A-Fa-f]{6}$/.test(text)) setColorHex(text);
  };

  const handlePresetColor = (hex: string) => {
    setColorHex(hex);
    setHexInput(hex);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a color name.');
      return;
    }
    if (!has2high && !has3high) {
      Alert.alert('Required', 'Select at least one size (2-High or 3-High).');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && original) {
        await updateLiftColor(
          colorId,
          name.trim(),
          original.name,
          has2high,
          has3high,
          colorHex,
          null,
          false
        );
      } else {
        await createLiftColor(name.trim(), has2high, has3high, colorHex, null);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save color.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Color',
      `Delete "${name}" and all its inventory data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLiftColor(colorId!, original!.name);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    photoBox: {
      margin: 12,
      borderRadius: 12,
      overflow: 'hidden',
      height: 180,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    photo: { width: '100%', height: '100%' },
    photoPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    photoPlaceholderText: { color: C.textSecondary, fontSize: 14 },
    removePhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-end',
      marginRight: 12,
      marginTop: 6,
      marginBottom: 4,
    },
    removePhotoBtnText: { color: C.danger, fontSize: 13, fontWeight: '600' },
    photoEditBadge: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(0,134,163,0.85)',
      borderRadius: 16,
      padding: 6,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      margin: 12,
      marginTop: 0,
      padding: 16,
    },
    label: { fontSize: 12, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    hint: { fontSize: 12, color: C.textSecondary, marginBottom: 12 },
    input: {
      backgroundColor: C.input,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: C.inputText,
      marginBottom: 0,
    },
    hexRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    hexPreview: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: C.cardBorder },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },
    presetSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: C.cardBorder,
    },
    presetSwatchSelected: {
      borderColor: C.text,
      borderWidth: 3,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
    },
    toggleLabel: { fontSize: 15, color: C.text, fontWeight: '600' },
    saveBtn: {
      backgroundColor: C.accent,
      borderRadius: 10,
      padding: 16,
      alignItems: 'center',
      marginHorizontal: 12,
      marginTop: 8,
    },
    saveBtnDisabled: { backgroundColor: C.separator },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    deleteBtn: {
      borderWidth: 1.5,
      borderColor: C.danger,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      marginHorizontal: 12,
      marginTop: 12,
    },
    deleteBtnText: { color: C.danger, fontWeight: '700', fontSize: 15 },
  }), [C]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Name */}
      <View style={styles.card}>
        <Text style={styles.label}>Color Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ocean Blue"
          placeholderTextColor={C.placeholder}
          autoCapitalize="words"
        />
      </View>

      {/* Hex color */}
      <View style={styles.card}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.hexRow}>
          <View style={[styles.hexPreview, { backgroundColor: colorHex }]} />
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={hexInput}
            onChangeText={handleHexChange}
            placeholder="#000000"
            placeholderTextColor={C.placeholder}
            autoCapitalize="none"
            maxLength={7}
          />
        </View>
        <View style={styles.presetGrid}>
          {PRESET_COLORS.map((hex) => (
            <Pressable
              key={hex}
              style={[
                styles.presetSwatch,
                { backgroundColor: hex },
                colorHex === hex && styles.presetSwatchSelected,
              ]}
              onPress={() => handlePresetColor(hex)}
            />
          ))}
        </View>
      </View>

      {/* Size availability */}
      <View style={styles.card}>
        <Text style={styles.label}>Available In</Text>
        <Text style={styles.hint}>Primary and Extender variations are created automatically for each selected size.</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>2-High</Text>
          <Switch
            value={has2high}
            onValueChange={setHas2high}
            trackColor={{ false: C.separator, true: C.accent }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>3-High</Text>
          <Switch
            value={has3high}
            onValueChange={setHas3high}
            trackColor={{ false: C.separator, true: C.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Save */}
      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Add Color'}</Text>
        )}
      </Pressable>

      {isEdit && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Color</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
