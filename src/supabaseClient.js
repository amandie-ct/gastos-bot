import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;


console.log('Supabase URL:', supabaseUrl); // Debug log
console.log('Supabase Key exists:', !!supabaseKey); // Debug log


export const supabase = createClient(supabaseUrl, supabaseKey);