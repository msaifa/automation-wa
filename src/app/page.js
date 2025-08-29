
"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [qr, setQr] = useState(null);
  const [ready, setReady] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await fetch("http://localhost:3001/wa/qr");
        const data = await res.json();
        if (data.qr) setQr(data.qr);
      } catch {}
    };
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:3001/wa/status");
        const data = await res.json();
        setReady(data.ready);
        setDisconnected(data.disconnected);
        if (data.disconnected) {
          setQr(null);
        }
      } catch {}
    };
    fetchQr();
    fetchStatus();
    const interval = setInterval(() => {
      fetchQr();
      fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const res = await fetch("http://localhost:3001/wa/reconnect", {
        method: 'POST'
      });
      if (res.ok) {
        setDisconnected(false);
        setReady(false);
        setQr(null);
      }
    } catch (error) {
      console.error('Reconnect failed:', error);
    }
    setReconnecting(false);
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin logout dari WhatsApp? Anda perlu scan QR code lagi untuk menghubungkan kembali.');
    
    if (!confirmed) return;
    
    try {
      const res = await fetch("http://localhost:3001/wa/logout", {
        method: 'POST'
      });
      if (res.ok) {
        setReady(false);
        setDisconnected(true);
        setQr(null);
        alert('Logout berhasil! Silakan klik "Hubungkan Kembali" untuk menghubungkan ulang.');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Koneksi WhatsApp Otomatis</h1>
        
        {disconnected ? (
          <div>
            <h2 style={{color: 'red'}}>WhatsApp Terputus!</h2>
            <p>Koneksi WhatsApp telah terputus. Klik tombol di bawah untuk menghubungkan kembali.</p>
            <button 
              onClick={handleReconnect}
              disabled={reconnecting}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: reconnecting ? 'not-allowed' : 'pointer'
              }}
            >
              {reconnecting ? 'Menghubungkan...' : 'Hubungkan Kembali'}
            </button>
          </div>
        ) : !ready ? (
          <div>
            <p>Scan QR code dengan WhatsApp Anda:</p>
            {qr ? (
              <img src={qr} alt="QR Code WhatsApp" style={{ width: 300 }} />
            ) : (
              <p>Menunggu QR code...</p>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{color: 'green'}}>WhatsApp Terhubung!</h2>
            <p>Pesan otomatis akan dikirim setiap pukul 17:41.</p>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => window.open('http://localhost:3001/wa/groups', '_blank')}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Lihat Daftar Grup
              </button>
              
              <button 
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Logout dari WhatsApp
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
