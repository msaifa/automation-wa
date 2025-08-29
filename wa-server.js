const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const groupId = '120363162959778625@g.us';
let qrCodeData = null;
let isReady = false;
let client;
let targetNumber = '6285147236609@c.us'; // Nomor tujuan chat pribadi
let isDisconnected = false;

function startWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
  });

  client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      qrCodeData = url;
      isReady = false;
      isDisconnected = false;
    });
  });

  client.on('ready', () => {
    isReady = true;
    isDisconnected = false;
    qrCodeData = null;
    console.log('WhatsApp connected successfully!');
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp disconnected:', reason);
    isReady = false;
    isDisconnected = true;
    qrCodeData = null;
    
    // Hapus session untuk force regenerate QR
    clearSession();
  });

  client.on('auth_failure', () => {
    console.log('WhatsApp authentication failed');
    isReady = false;
    isDisconnected = true;
    clearSession();
  });

  client.initialize();
}

function clearSession() {
  try {
    const sessionPath = path.join(__dirname, '.wwebjs_auth');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('Session cleared');
    }
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

app.get('/wa/qr', (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else {
    res.status(404).json({ error: 'QR not available yet.' });
  }
});

app.get('/wa/status', (req, res) => {
  res.json({ 
    ready: isReady,
    disconnected: isDisconnected,
    hasQr: !!qrCodeData
  });
});

app.post('/wa/reconnect', (req, res) => {
  try {
    if (client) {
      client.destroy();
    }
    isReady = false;
    isDisconnected = false;
    qrCodeData = null;
    
    // Clear session and restart
    clearSession();
    setTimeout(() => {
      startWhatsApp();
      res.json({ success: true, message: 'Reconnecting...' });
    }, 1000);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/wa/logout', async (req, res) => {
  try {
    if (!isReady || !client) {
      return res.status(400).json({ error: 'WhatsApp not connected' });
    }
    
    // Logout dari device WhatsApp
    await client.logout();
    
    // Reset semua status
    isReady = false;
    isDisconnected = true;
    qrCodeData = null;
    
    // Clear session
    clearSession();
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/wa/send', express.json(), (req, res) => {
  if (!isReady) return res.status(400).json({ error: 'WhatsApp not ready.' });
  const { number, message, isGroup, mentions } = req.body;
  
  const options = {};
  if (isGroup && mentions && mentions.length > 0) {
    options.mentions = mentions;
  }
  
  client.sendMessage(number, message, options)
    .then(() => res.json({ success: true }))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.get('/wa/groups', async (req, res) => {
  try {
    if (!isReady || !client) {
      return res.status(400).json({ error: 'WhatsApp not connected' });
    }
    
    // Ambil semua chat
    const chats = await client.getChats();
    
    // Filter hanya grup
    const groups = chats.filter(chat => chat.isGroup);
    
    // Format response
    const groupList = groups.map((group, index) => ({
      index: index + 1,
      name: group.name,
      id: group.id._serialized,
      participants: group.participants ? group.participants.length : 0
    }));
    
    res.json({ 
      success: true, 
      total: groupList.length,
      groups: groupList 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start WhatsApp client
startWhatsApp();

// Schedule message every day at 17:53
const schedule = require('node-schedule');
const dayjs = require('dayjs');
const tanggal = dayjs().format('DD/MM/YYYY');

schedule.scheduleJob('03 19 * * *', () => {
  if (isReady && groupId) {
    client.sendMessage(groupId, `#MorningBrief #${tanggal}
        
Ari @6285147236609 ini mau kerjakan fitur atau tiket apa? dan apakah ada masalah atau kendala hari ini?
Rifal @Rifal ICT hari ini mau kerjakan fitur atau tiket apa? dan apakah ada masalah atau kendala hari ini?
Wahyu @Wahyu ICT sudah lapor breaf morning di grup web`, {
      mentions: [targetNumber]
    })
      .catch((e) => console.log('failed send message',e));
  }
});

app.listen(3001, () => {
  console.log('WhatsApp server running on port 3001');
});
