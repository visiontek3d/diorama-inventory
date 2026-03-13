import React, { useEffect, useState } from 'react';
import {
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

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditSku'>;

export default function AddEditSkuScreen({ route, navigation }: Props) {
  const editSku = route.params?.sku;
  const isEdit = !!editSku;

  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [carryStock, setCarryStock] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Diorama' : 'Add Diorama' });
    if (isEdit) {
      const d = getDiorama(editSku);
      if (d) {
        setSku(d.sku);
        setDescription(d.description);
        setPhotoUri(d.photo_uri);
        setCarryStock(!!d.carry_stock);
      }
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
            aspect: [4, 3],
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
            aspect: [4, 3],
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

  const handleSave = () => {
    const trimmedSku = sku.trim().toUpperCase();
    if (!trimmedSku) { Alert.alert('SKU is required'); return; }

    if (isEdit) {
      updateDiorama(trimmedSku, description.trim(), photoUri, carryStock);
      navigation.goBack();
    } else {
      const existing = getDiorama(trimmedSku);
      if (existing) { Alert.alert('SKU already exists', `${trimmedSku} is already in use.`); return; }
      createDiorama(trimmedSku, description.trim(), photoUri, carryStock);
      navigation.replace('SkuDetail', { sku: trimmedSku });
    }
  };

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
            placeholderTextColor="#aaa"
            autoCapitalize="characters"
            editable={!isEdit}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description..."
            placeholderTextColor="#aaa"
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
                <Text style={[styles.photoBtnText, { color: '#c62828' }]}>Remove Photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.photoPlaceholder} onPress={handlePickPhoto}>
              <Text style={styles.photoPlaceholderText}>+ Add Photo</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Diorama'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    elevation: 1,
  },
  label: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputDisabled: { backgroundColor: '#eee', color: '#888' },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  photoPlaceholder: {
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { color: '#3367d6', fontSize: 16, fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
  photoBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#3367d6',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  removeBtn: { borderColor: '#c62828' },
  photoBtnText: { color: '#3367d6', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#3367d6',
    margin: 12,
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
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
    borderColor: '#3367d6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#3367d6' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  checkboxLabel: { fontSize: 15, color: '#1a1a1a' },
});
