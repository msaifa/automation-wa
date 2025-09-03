# WhatsApp Auto Brief

Aplikasi otomatisasi WhatsApp untuk mengirim pesan terjadwal.

## Fitur

1. **Koneksi WhatsApp**: Menghubungkan aplikasi dengan WhatsApp melalui QR Code
2. **Status Monitoring**: Menampilkan status koneksi dan informasi groups
3. **Daftar Groups**: Melihat semua groups yang tersedia
4. **Pesan Terjadwal**: Mengirim pesan otomatis setiap hari pukul 09:00 ke group "dumdumm"
5. **Logout**: Memutuskan koneksi WhatsApp

## Cara Menjalankan

### Instalasi Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```
Ini akan menjalankan:
- Frontend (React + Vite) di port 5173
- Backend (Express + WhatsApp) di port 3001

### Production Mode
```bash
npm run build
npm start
```

## Cara Penggunaan

1. Jalankan aplikasi dengan `npm run dev`
2. Buka browser dan akses `http://localhost:5173`
3. Klik "Hubungkan ke WhatsApp"
4. Scan QR Code yang muncul dengan WhatsApp di ponsel
5. Setelah terhubung, Anda dapat:
   - Melihat daftar groups
   - Logout dari WhatsApp
6. Pesan "halo selamat pagi" akan otomatis dikirim ke group "dumdumm" setiap hari pukul 09:00

## Teknologi yang Digunakan

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **WhatsApp Integration**: whatsapp-web.js
- **Scheduler**: node-schedule
- **QR Code**: qrcode

## Struktur Project

```
├── src/
│   ├── App.jsx          # Komponen utama React
│   ├── main.jsx         # Entry point React
│   └── index.css        # Styling CSS
├── wa-server.js         # Server Express + WhatsApp
├── vite.config.js       # Konfigurasi Vite
├── index.html           # HTML template
├── package.json         # Dependencies dan scripts
└── README.md           # Dokumentasi
```

## API Endpoints

- `GET /api/status` - Mendapatkan status koneksi WhatsApp
- `GET /api/qr` - Mendapatkan QR Code untuk koneksi
- `GET /api/groups` - Mendapatkan daftar groups WhatsApp
- `POST /api/connect` - Inisiasi koneksi WhatsApp
- `POST /api/logout` - Logout dari WhatsApp

## Catatan

- Pastikan WhatsApp Web dapat diakses dari komputer Anda
- Session WhatsApp akan disimpan secara lokal menggunakan LocalAuth
- Pesan terjadwal hanya akan dikirim jika aplikasi sedang berjalan
- Group "dumdumm" harus ada di daftar groups untuk dapat menerima pesan otomatis
