import 'react-native-url-polyfill/auto';
import { supabaseUrl, supabaseAnonKey } from '@env';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
