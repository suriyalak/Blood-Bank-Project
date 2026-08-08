import { createClient } from '@supabase/supabase-js';

// ใส่ URL และ Anon Key ของโครงการคุณ
const SUPABASE_URL = 'https://sxufilpozwqfhjhhwvxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sAhfJtEaSv4T08NZFXj44A_aB0txngO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);