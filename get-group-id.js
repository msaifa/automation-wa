const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on('ready', async () => {
  console.log('WhatsApp sudah terhubung!');
  
  // Ambil semua chat
  const chats = await client.getChats();
  
  // Filter hanya grup
  const groups = chats.filter(chat => chat.isGroup);
  
  console.log('\n=== DAFTAR GRUP WHATSAPP ===');
  groups.forEach((group, index) => {
    console.log(`${index + 1}. Nama: ${group.name}`);
    console.log(`   ID: ${group.id._serialized}`);
    console.log('---');
  });
  
  process.exit(0);
});

client.on('qr', (qr) => {
  console.log('Scan QR code di WhatsApp Anda untuk mendapatkan daftar grup');
});

client.initialize();
