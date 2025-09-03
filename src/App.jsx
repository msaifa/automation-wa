import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [qr, setQr] = useState(null);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await fetch("/wa/qr");
        const data = await res.json();
        if (data.qr) setQr(data.qr);
      } catch {}
    };
    const fetchStatus = async () => {
      try {
        const res = await fetch("/wa/status");
        const data = await res.json();
        setReady(data.ready);
        setAuthenticated(data.authenticated);
        setLoading(data.loading);
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
      const res = await fetch("/wa/reconnect", {
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

  const handleForceReady = async () => {
    try {
      const res = await fetch("/wa/force-ready", {
        method: 'POST'
      });
      if (res.ok) {
        // Refresh status immediately
        const statusRes = await fetch("/wa/status");
        const statusData = await statusRes.json();
        setReady(statusData.ready);
        setAuthenticated(statusData.authenticated);
        setLoading(statusData.loading);
        setDisconnected(statusData.disconnected);
      }
    } catch (error) {
      console.error('Force ready failed:', error);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin logout dari WhatsApp? Anda perlu scan QR code lagi untuk menghubungkan kembali.');
    
    if (!confirmed) return;
    
    try {
      const res = await fetch("/wa/logout", {
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
    <div className="page">
      <main className="main">
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
        ) : ready ? (
          <div>
            <h2 style={{color: 'green'}}>WhatsApp Terhubung!</h2>
            <p>Pesan otomatis akan dikirim setiap pukul 09:00 (Senin-Jumat).</p>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => {
                  // Test groups endpoint first
                  fetch('/wa/groups')
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        // If success, open in new tab with formatted data
                        const groupsHtml = `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>Daftar Grup WhatsApp</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; }
                              table { border-collapse: collapse; width: 100%; }
                              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                              th { background-color: #f2f2f2; }
                              .group-id { font-family: monospace; font-size: 12px; }
                            </style>
                          </head>
                          <body>
                            <h1>Daftar Grup WhatsApp (${data.total} grup)</h1>
                            <table>
                              <tr>
                                <th>No</th>
                                <th>Nama Grup</th>
                                <th>ID Grup</th>
                                <th>Peserta</th>
                              </tr>
                              ${data.groups.map(group => `
                                <tr>
                                  <td>${group.index}</td>
                                  <td>${group.name}</td>
                                  <td class="group-id">${group.id}</td>
                                  <td>${group.participants}</td>
                                </tr>
                              `).join('')}
                            </table>
                          </body>
                          </html>
                        `;
                        const newWindow = window.open('', '_blank');
                        newWindow.document.write(groupsHtml);
                        newWindow.document.close();
                      } else {
                        alert(`Error: ${data.error}${data.suggestion ? '\n\nSaran: ' + data.suggestion : ''}`);
                      }
                    })
                    .catch(error => {
                      alert('Gagal mengambil daftar grup. Pastikan WhatsApp benar-benar terhubung dan coba lagi.');
                      console.error('Groups fetch error:', error);
                    });
                }}
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
        ) : authenticated && loading ? (
          <div>
            <h2 style={{color: 'orange'}}>WhatsApp Sedang Memuat...</h2>
            <p>Sedang menghubungkan ke WhatsApp, harap tunggu...</p>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #25D366',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <br />
            <button 
              onClick={handleForceReady}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#f0ad4e',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Skip Loading (Force Ready)
            </button>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : qr ? (
          <div>
            <p>Scan QR code dengan WhatsApp Anda:</p>
            <img src={qr} alt="QR Code WhatsApp" style={{ width: 300 }} />
          </div>
        ) : (
          <div>
            <p>Scan QR code dengan WhatsApp Anda:</p>
            {qr ? (
              <img src={qr} alt="QR Code WhatsApp" style={{ width: 300 }} />
            ) : (
              <p>Menunggu QR code...</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
