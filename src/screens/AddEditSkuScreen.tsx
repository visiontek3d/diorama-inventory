import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { createDiorama, getDiorama, updateDiorama } from '../db/database';
import { RootStackParamList } from '../types';
import { useAppTheme } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditSku'>;

export default function AddEditSkuScreen({ route, navigation }: Props) {
  const C = useAppTheme();
  const editSku = route.params?.sku;
  const isEdit = !!editSku;

  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [carryStock, setCarryStock] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Diorama' : 'Add Diorama' });
    if (isEdit) {
      (async () => {
        const d = await getDiorama(editSku);
        if (d) {
          setSku(d.sku);
          setDescription(d.description);
          setPhotoUri(d.photo_url);
          setCarryStock(!!d.carry_stock);
        }
      })();
    }
  }, []);

  const handlePickPhoto = async () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Camera permission required'); return; }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
          });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Gallery permission required'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
          });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      {
        text: 'Google Drive / Files',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: ['image/*'],
            copyToCacheDirectory: true,
          });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const trimmedSku = sku.trim().toUpperCase();
    if (!trimmedSku) { Alert.alert('SKU is required'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await updateDiorama(trimmedSku, description.trim(), photoUri, carryStock);
        navigation.goBack();
      } else {
        const existing = await getDiorama(trimmedSku);
        if (existing) { Alert.alert('SKU already exists', `${trimmedSku} is already in use.`); return; }
        await createDiorama(trimmedSku, description.trim(), photoUri, carryStock);
        navigation.replace('SkuDetail', { sku: trimmedSku });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save diorama.');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    card: {
      backgroundColor: C.card,
      borderRadius: 10,
      margin: 12,
      marginBottom: 0,
      padding: 16,
      elevation: 1,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    label: {
      fontSize: 12,
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 8,
      padding: 10,
      fontSize: 15,
      color: C.inputText,
      backgroundColor: C.input,
    },
    inputDisabled: { backgroundColor: C.separator, color: C.textSecondary },
    inputMultiline: { height: 80, textAlignVertical: 'top' },
    photoPlaceholder: {
      height: 120,
      borderWidth: 2,
      borderColor: C.inputBorder,
      borderStyle: 'dashed',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoPlaceholderText: { color: C.accent, fontSize: 16, fontWeight: '600' },
    preview: { width: '100%', height: 300, borderRadius: 8, marginBottom: 10 },
    photoBtn: {
      padding: 10,
      borderWidth: 1,
      borderColor: C.accent,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    removeBtn: { borderColor: C.danger },
    photoBtnText: { color: C.accent, fontWeight: '600' },
    saveBtn: {
      backgroundColor: C.accent,
      margin: 12,
      marginTop: 20,
      padding: 16,
      borderRadius: 10,
      alignItems: 'center',
      elevation: 2,
    },
    saveBtnDisabled: { backgroundColor: '#aaa' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 10,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: C.accent,
      backgroundColor: C.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: C.accent },
    checkmark: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
    checkboxLabel: { fontSize: 15, color: C.text },
  }), [C]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          <Text style={styles.label}>SKU *</Text>
          <TextInput
            style={[styles.input, isEdit && styles.inputDisabled]}
            value={sku}
            onChangeText={(t) => setSku(t.toUpperCase())}
            placeholder="e.g. DIO-001"
            placeholderTextColor={C.placeholder}
            autoCapitalize="characters"
            editable={!isEdit}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description..."
            placeholderTextColor={C.placeholder}
            multiline
            numberOfLines={3}
          />

          <Pressable style={styles.checkboxRow} onPress={() => setCarryStock((v) => !v)}>
            <View style={[styles.checkbox, carryStock && styles.checkboxChecked]}>
              {carryStock && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Carry Stock</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Photo</Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
              <Pressable style={styles.photoBtn} onPress={handlePickPhoto}>
                <Text style={styles.photoBtnText}>Change Photo</Text>
              </Pressable>
              <Pressable style={[styles.photoBtn, styles.removeBtn]} onPress={() => setPhotoUri(null)}>
                <Text style={[styles.photoBtnText, { color: C.danger }]}>Remove Photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.photoPlaceholder} onPress={handlePickPhoto}>
              <Text style={styles.photoPlaceholderText}>+ Add Photo</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Diorama'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
