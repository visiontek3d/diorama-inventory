import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useAppTheme } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const LOGO = require('../../assets/logo.png');

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
      width: 300,
      height: 300,
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
      paddingVertical: 32,
      alignItems: 'center',
      gap: 8,
    },
    cardPressed: {
      backgroundColor: C.separator,
      borderColor: C.accent,
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
          <Ionicons name="cube-outline" size={40} color={C.accent} />
          <Text style={styles.cardTitle}>Diorama</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('LiftList')}
        >
          <Ionicons name="layers-outline" size={40} color={C.accent} />
          <Text style={styles.cardTitle}>Lift</Text>
        </Pressable>
      </View>
    </View>
  );
}
