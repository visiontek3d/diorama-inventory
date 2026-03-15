import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const SUPABASE_URL = IS_EXPO_GO
  ? 'https://nlwjhqmbwwfigsppnjcm.supabase.co'
  : 'https://bzujsogysyyngjljldpf.supabase.co';

const SUPABASE_ANON_KEY = IS_EXPO_GO
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sd2pocW1id3dmaWdzcHBuamNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTIxMjIsImV4cCI6MjA4OTA4ODEyMn0.vXwbSAMfvmrgeq6eTNhUiHEB9AEzBSV2cD6vccDj9xk'
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dWpzb2d5c3l5bmdqbGpsZHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTE3NTYsImV4cCI6MjA4OTA4Nzc1Nn0.DDHdfYYQqKNEf1GJftDoHcicle19xm5j6JeLYu_pCyY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
