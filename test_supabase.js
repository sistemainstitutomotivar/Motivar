import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("Missing URL or Key");
  process.exit(1);
}

const supabase = createClient(url, key);

async function testInsert() {
  const { data, error } = await supabase.from('clinic_therapists').insert([{
    name: 'Test Therapist RLS',
    specialty: 'Psicologia',
    contact: '00000000',
    status: 'active'
  }]);

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}

testInsert();
