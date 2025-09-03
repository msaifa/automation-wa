# WhatsApp Auto Brief

Aplikasi untuk mengirim pesan otomatis ke grup WhatsApp berdasarkan jadwal tertentu.

## Persyaratan Sistem

- Node.js 16 atau lebih tinggi
- npm 7 atau lebih tinggi

## Instalasi

1. Clone repository ini
2. Install dependencies:
   ```bash
   npm install
   ```

## Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
```
Perintah ini akan menjalankan:
- WhatsApp server di port 3001
- React frontend di port 3000

### Production Mode
```bash
# Build aplikasi
npm run build

# Jalankan server WhatsApp
npm start
```

## Fitur

- **Koneksi WhatsApp**: Scan QR code untuk menghubungkan WhatsApp
- **Pesan Otomatis**: Mengirim pesan brief otomatis setiap hari Senin-Jumat pukul 09:00
- **Manajemen Koneksi**: Reconnect dan logout dari WhatsApp
- **Daftar Grup**: Melihat semua grup WhatsApp yang tersedia

## Teknologi yang Digunakan

- **Frontend**: React.js 18 + Vite
- **Backend**: Express.js + whatsapp-web.js
- **Scheduler**: node-schedule
- **QR Code**: qrcode

## API Endpoints

- `GET /wa/qr` - Mendapatkan QR code untuk login WhatsApp
- `GET /wa/status` - Status koneksi WhatsApp
- `POST /wa/reconnect` - Reconnect WhatsApp
- `POST /wa/logout` - Logout dari WhatsApp
- `GET /wa/groups` - Daftar grup WhatsApp
- `POST /wa/send` - Kirim pesan

## Konfigurasi

Edit file `wa-server.js` untuk mengubah:
- Group ID target
- Nomor yang akan di-tag
- Jadwal pengiriman pesan
- Template pesan

## Catatan

- Aplikasi ini kompatibel dengan Node.js 16
- WhatsApp session akan tersimpan lokal di folder `.wwebjs_auth`
- Aplikasi frontend berjalan di port 3000, API di port 3001
