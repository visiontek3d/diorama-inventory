import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppTheme } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const LOGO = require('../../assets/logo.png');
const DIORAMA_CARD = require('../../assets/diorama-card.png');
const LIFT_CARD = require('../../assets/lift-card.png');

export default function HomeScreen({ navigation }: Props) {
  const C = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logo: {
      width: 360,
      height: 360,
      marginBottom: -40,
    },
    brand: {
      fontSize: 26,
      fontWeight: '800',
      color: C.text,
      letterSpacing: 3,
      marginBottom: 48,
    },
    buttonGrid: {
      flexDirection: 'row',
      gap: 16,
      width: '100%',
    },
    card: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingVertical: 28,
      alignItems: 'center',
      gap: 12,
    },
    cardPressed: {
      backgroundColor: C.separator,
      borderColor: C.accent,
    },
    cardImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: C.text,
      letterSpacing: 1,
    },
    cardSubtitle: {
      fontSize: 13,
      color: C.textSecondary,
      fontWeight: '600',
    },
  }), [C]);

  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <Text style={styles.brand}>Inventory Management</Text>

      <View style={styles.buttonGrid}>
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('SkuList')}
        >
          <Image source={DIORAMA_CARD} style={styles.cardImage} resizeMode="cover" />
          <Text style={styles.cardTitle}>Diorama</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('LiftList')}
        >
          <Image source={LIFT_CARD} style={styles.cardImage} resizeMode="cover" />
          <Text style={styles.cardTitle}>Lift</Text>
        </Pressable>
      </View>
    </View>
  );
}
