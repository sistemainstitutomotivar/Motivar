const url = 'https://twpnvctojxhspwvygwae.supabase.co/rest/v1/clinic_patients?select=*&limit=1';
const key = 'sb_publishable_oiNi6a0LFcTsekzD_iBdRA_IoYv3j74';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
})
.then(r => r.json().then(j => ({status: r.status, data: j})))
.then(res => console.log(JSON.stringify(res, null, 2)))
.catch(err => console.error(err));
