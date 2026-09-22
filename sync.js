const fs = require('fs');

async function sync() {
  const password = 'bomiu';
  const baseUrl = 'https://wedding-bomiu.vercel.app';
  
  console.log('Logging in...');
  const loginRes = await fetch(`${baseUrl}/api/auth`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'Referer': baseUrl + '/'
    },
    body: JSON.stringify({ password })
  });
  
  if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());
  
  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('No cookie received');
  
  const cookie = cookieHeader.split(';')[0];
  console.log('Logged in. Fetching remote data...');
  
  const remoteRes = await fetch(`${baseUrl}/api/data`, {
    headers: { 'Cookie': cookie }
  });
  const remoteData = await remoteRes.json();
  
  const localData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  
  // Merge music tracks and heroBgUrl
  remoteData.invitation.musicTracks = localData.invitation.musicTracks;
  remoteData.invitation.heroBgUrl = localData.invitation.heroBgUrl;
  
  console.log('Pushing ' + remoteData.invitation.musicTracks.length + ' tracks and new hero image to remote...');
  
  const pushRes = await fetch(`${baseUrl}/api/data`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'Origin': baseUrl,
      'Referer': baseUrl + '/'
    },
    body: JSON.stringify(remoteData)
  });
  
  if (!pushRes.ok) throw new Error('Push failed: ' + await pushRes.text());
  console.log('Success!');
}

sync().catch(console.error);
