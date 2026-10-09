import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

async function run() {
  const res = await fetch(`${url}/rest/v1/personnel?select=id,seq_no,full_name_th,rank_th,first_name_th,last_name_th,duty_status,citizen_id`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });

  const allData = await res.json();
  if (!Array.isArray(allData)) {
    console.error('Response error:', allData);
    return;
  }
  console.log('Total count:', allData.length);
  const bad = allData.filter(r => !r.full_name_th || !r.full_name_th.trim() || !r.first_name_th);
  console.log('Bad rows count:', bad.length);
  console.log('Bad rows:', bad);

  // If there are bad rows, delete them
  for (const b of bad) {
    console.log(`Deleting bad row id: ${b.id}, seq_no: ${b.seq_no}...`);
    const delRes = await fetch(`${url}/rest/v1/personnel?id=eq.${b.id}`, {
      method: 'DELETE',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    console.log('Deleted status:', delRes.status);
  }
}

run();
