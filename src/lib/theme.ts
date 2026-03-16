import { useColorScheme } from 'react-native';

export const darkColors = {
  background: '#111111',
  card: '#2e2e2e',
  cardBorder: '#3a3a3a',
  text: '#ffffff',
  textSecondary: '#9a9a9a',
  accent: '#0086A3',
  accentText: '#ffffff',
  tabBar: '#1a1a1a',
  tabActive: '#0086A3',
  tabInactive: '#666666',
  input: '#2e2e2e',
  inputBorder: '#3a3a3a',
  inputText: '#ffffff',
  placeholder: '#666666',
  separator: '#2a2a2a',
  badge: '#0086A3',
  badgeText: '#ffffff',
  danger: '#ef4444',
  headerBg: '#000000',
  headerText: '#ffffff',
  overlay: 'rgba(0,0,0,0.7)',
  sectionHeader: '#1a1a1a',
  sectionHeaderText: '#0086A3',
  buttonSecondary: '#2e2e2e',
  buttonSecondaryText: '#ffffff',
  icon: '#ffffff',
  scanOverlay: 'rgba(0,0,0,0.6)',
};

export const lightColors: typeof darkColors = {
  background: '#f0ede8',
  card: '#ffffff',
  cardBorder: '#ddd8d0',
  text: '#111111',
  textSecondary: '#666666',
  accent: '#0086A3',
  accentText: '#ffffff',
  tabBar: '#ffffff',
  tabActive: '#0086A3',
  tabInactive: '#999999',
  input: '#ffffff',
  inputBorder: '#ccc8c0',
  inputText: '#111111',
  placeholder: '#aaaaaa',
  separator: '#e8e4de',
  badge: '#0086A3',
  badgeText: '#ffffff',
  danger: '#dc2626',
  headerBg: '#000000',
  headerText: '#ffffff',
  overlay: 'rgba(0,0,0,0.5)',
  sectionHeader: '#e8e4de',
  sectionHeaderText: '#0086A3',
  buttonSecondary: '#e8e4de',
  buttonSecondaryText: '#111111',
  icon: '#111111',
  scanOverlay: 'rgba(0,0,0,0.5)',
};

export type AppColors = typeof darkColors;

export function useAppTheme(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
