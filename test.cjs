const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const url = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("No URL/KEY found");
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('clinic_therapists').insert([
    { name: 'Test', specialty: 'Test', contact: '123', status: 'active' }
  ]);
  if (error) {
    console.log("Error inserting:", error.message);
  } else {
    console.log("Insert success!");
  }
}
run();
