import React, { useState, useEffect } from 'react';

const App = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    qrCode: null,
    groupsCount: 0
  });
  const [groups, setGroups] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check status every 3 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setStatus(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to connect to server');
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    try {
      setError('');
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log(data.message);
    } catch (err) {
      setError('Failed to connect to WhatsApp');
    }
  };

  const handleLogout = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setShowGroups(false);
      setGroups([]);
      setLoading(false);
      console.log(data.message);
    } catch (err) {
      setError('Failed to logout');
      setLoading(false);
    }
  };

  const handleShowGroups = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/groups');
      const data = await response.json();
      
      if (response.ok) {
        setGroups(data.groups);
        setShowGroups(true);
      } else {
        setError(data.error || 'Failed to load groups');
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load groups');
      setLoading(false);
    }
  };

  if (loading && !status.isConnected && !status.qrCode) {
    return (
      <div className="container">
        <div className="header">
          <h1>WhatsApp Auto Brief</h1>
        </div>
        <div className="loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>WhatsApp Auto Brief</h1>
        <p>Automated WhatsApp messaging system</p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* Connection Status */}
      <div className={`status-card ${status.isConnected ? 'status-connected' : 'status-disconnected'}`}>
        <h3>Status: {status.isConnected ? 'Terhubung' : 'Tidak Terhubung'}</h3>
        {status.isConnected && (
          <p>Groups ditemukan: {status.groupsCount}</p>
        )}
      </div>

      {/* QR Code Display */}
      {!status.isConnected && status.qrCode && (
        <div className="qr-container">
          <h3>Scan QR Code untuk menghubungkan WhatsApp</h3>
          <img src={status.qrCode} alt="QR Code" className="qr-code" />
          <p>Buka WhatsApp di ponsel Anda dan scan QR code di atas</p>
        </div>
      )}

      {/* Connect Button */}
      {!status.isConnected && !status.qrCode && (
        <div style={{ textAlign: 'center' }}>
          <button className="button" onClick={handleConnect}>
            Hubungkan ke WhatsApp
          </button>
        </div>
      )}

      {/* Connected Actions */}
      {status.isConnected && (
        <div style={{ textAlign: 'center' }}>
          <button 
            className="button" 
            onClick={handleShowGroups}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Lihat Daftar Group'}
          </button>
          <button 
            className="button button-danger" 
            onClick={handleLogout}
            disabled={loading}
          >
            Logout
          </button>
        </div>
      )}

      {/* Groups List */}
      {showGroups && groups.length > 0 && (
        <div className="groups-container">
          <h3>Daftar Groups ({groups.length})</h3>
          <div className="groups-list">
            {groups.map((group, index) => (
              <div key={group.id} className="group-item">
                <strong>{group.name}</strong>
                <br />
                <small>{group.id}</small>
              </div>
            ))}
          </div>
          <button 
            className="button button-secondary" 
            onClick={() => setShowGroups(false)}
          >
            Tutup Daftar
          </button>
        </div>
      )}

      {/* Cron Job Info */}
      {status.isConnected && (
        <div className="info">
          <h4>Jadwal Otomatis</h4>
          <p>Pesan "halo selamat pagi" akan dikirim otomatis setiap hari pukul 09:00 ke group "dumdumm"</p>
        </div>
      )}
    </div>
  );
};

export default App;
