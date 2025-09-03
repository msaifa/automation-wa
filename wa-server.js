const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const schedule = require('node-schedule');
const path = require('path');
const dayjs = require('dayjs');

const app = express();
const port = 3001;

const groupId = '120363162959778625@g.us';
const tanggal = dayjs().format('DD/MM/YYYY');
const text = `#MorningBrief #${tanggal}
        
Untuk Hari ini mau mengerjakan apa aja ? Dan apakah ada kendala atau masalah ?

cc @6285806083274 @6289501201414 @6285704134504`;
const mentionNumber = ['6285806083274@c.us', '6289501201414@c.us', '6285704134504@c.us'];
const cron = '* 9 * * *'; // Every day at 09:00 AM UTC+7 (11:00 AM UTC)

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// State management
let clientState = {
  isConnected: false,
  qrCode: null,
  client: null,
  groups: []
};

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

clientState.client = client;

// Event handlers
client.on('qr', async (qr) => {
  console.log('QR Code received');
  try {
    const qrCodeDataURL = await qrcode.toDataURL(qr);
    clientState.qrCode = qrCodeDataURL;
    clientState.isConnected = false;
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
});

client.on('ready', async () => {
  console.log('WhatsApp client is ready!');
  clientState.isConnected = true;
  clientState.qrCode = null;
  
  // Get all groups
  try {
    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    clientState.groups = groups.map(group => ({
      id: group.id._serialized,
      name: group.name
    }));
    console.log('Groups loaded:', clientState.groups.length);
  } catch (error) {
    console.error('Error loading groups:', error);
  }
});

client.on('authenticated', () => {
  console.log('WhatsApp client authenticated');
});

client.on('auth_failure', () => {
  console.log('Authentication failed');
  clientState.isConnected = false;
  clientState.qrCode = null;
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp client disconnected:', reason);
  clientState.isConnected = false;
  clientState.qrCode = null;
  clientState.groups = [];
});

// Schedule cron job for 9 AM daily
schedule.scheduleJob(cron, async () => {
  if (clientState.isConnected && clientState.client) {
    try {
      await clientState.client.sendMessage(groupId, text, {
        mentions: mentionNumber
      });
      console.log('Good morning message sent to dumdumm group');
    } catch (error) {
      console.error('Error sending scheduled message:', error);
    }
  }
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    isConnected: clientState.isConnected,
    qrCode: clientState.qrCode,
    groupsCount: clientState.groups.length
  });
});

app.get('/api/qr', (req, res) => {
  if (clientState.qrCode) {
    res.json({ qrCode: clientState.qrCode });
  } else {
    res.json({ qrCode: null });
  }
});

app.get('/api/groups', (req, res) => {
  if (clientState.isConnected) {
    res.json({ groups: clientState.groups });
  } else {
    res.status(400).json({ error: 'WhatsApp not connected' });
  }
});

app.post('/api/connect', (req, res) => {
  if (!clientState.isConnected) {
    client.initialize();
    res.json({ message: 'Connecting to WhatsApp...' });
  } else {
    res.json({ message: 'Already connected' });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    if (clientState.client) {
      await clientState.client.logout();
      await clientState.client.destroy();
    }
    clientState.isConnected = false;
    clientState.qrCode = null;
    clientState.groups = [];
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Error during logout' });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  
  // Auto-initialize WhatsApp client on server start
  client.initialize();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (clientState.client) {
    await clientState.client.destroy();
  }
  process.exit(0);
});
