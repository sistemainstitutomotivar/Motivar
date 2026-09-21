const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://twpnvctojxhspwvygwae.supabase.co', 'sb_publishable_oiNi6a0LFcTsekzD_iBdRA_IoYv3j74');

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@institutomotivar.com.br',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test',
        cpf: '11111111111',
        role: 'admin'
      }
    }
  });
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
