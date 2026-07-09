'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="container">Loading...</div>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <Dashboard session={session} />;
}

function LoginScreen() {
  const [denied, setDenied] = useState(false);

  const handleLogin = async () => {
    const res = await signIn('google', { redirect: false });
    if (res?.error) setDenied(true);
  };

  return (
    <div className="login-card">
      <span style={{ fontSize: 44 }}>🗑️</span>
      <h1>Garbage Collector Bot</h1>
      <p>Login with your NITC email ID to continue</p>
      <button className="google-btn" onClick={handleLogin}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.1 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.1 5.5 29.3 3.5 24 3.5c-7.6 0-14.1 4.3-17.7 11.2z"/>
          <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.4-7.2 2.4-5.4 0-9.9-3.1-11.4-7.6l-6.5 5c3.5 7 10.7 10.6 17.9 10.6z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.7 5.1l6.2 5.2C40.7 35.9 44.5 30.5 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
        </svg>
        Login with NITC email ID
      </button>
      {denied && (
        <div className="denied">
          Access denied. Please login with your official @nitc.ac.in email address.
        </div>
      )}
    </div>
  );
}

function Dashboard({ session }) {
  const [bins, setBins] = useState([]);
  const [pendingBinNames, setPendingBinNames] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openRemark, setOpenRemark] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [binsRes, statusRes] = await Promise.all([
      fetch('/api/admin/bins'),
      fetch('/api/status'),
    ]);
    const binsData = await binsRes.json();
    const statusData = await statusRes.json();
    setBins(binsData.bins || []);
    setPendingBinNames(statusData.pendingBinNames || []);
    setMySubmissions(statusData.mine || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableBins = bins.filter((b) => !pendingBinNames.includes(b.name));

  const toggleSelect = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
    setOpenRemark(openRemark === name ? null : name);
  };

  const handleSubmit = () => setShowConfirm(true);

  const confirmSubmit = async () => {
    setSubmitting(true);
    setShowConfirm(false);
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bins: selected }),
    });
    const data = await res.json();
    setSubmitting(false);
    setSelected([]);
    setOpenRemark(null);

    if (data.alreadyPending && data.alreadyPending.length > 0) {
      setNotice(
        `This is already given for collection: ${data.alreadyPending.join(', ')}`
      );
    } else {
      setNotice('');
    }
    await loadData();
  };

  return (
    <div className="container">
      <div className="topbar">
        <span className="who">Logged in as {session.user.email}</span>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {session.isAdmin && (
            <a className="admin-link" href="/admin">
              Admin Panel
            </a>
          )}
          <button className="signout-btn" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="hero">
        <span className="icon">🗑️♻️</span>
        <h1>Garbage Collector Bot</h1>
        <p>Select the bins that are filled and let the team know</p>
      </div>

      <div className="card">
        <h2>Select bins</h2>
        {notice && <div className="notice">{notice}</div>}
        <div className="bin-grid">
          {availableBins.map((bin) => (
            <div key={bin.name}>
              <div
                className={`bin-chip ${selected.includes(bin.name) ? 'selected' : ''}`}
                onClick={() => toggleSelect(bin.name)}
              >
                {bin.name.toUpperCase()}
              </div>
              {openRemark === bin.name && (
                <div className="remark-box">{bin.remark}</div>
              )}
            </div>
          ))}
          {availableBins.length === 0 && (
            <p style={{ color: '#888' }}>All bins are currently pending collection.</p>
          )}
        </div>

        <button
          className="submit-btn"
          disabled={selected.length === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      <div className="card">
        <h2>Your submissions</h2>
        {mySubmissions.length === 0 ? (
          <p style={{ color: '#888' }}>No submissions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bin</th>
                <th>Submitted at</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mySubmissions.map((s) => (
                <tr key={s.id}>
                  <td>{s.bin_name.toUpperCase()}</td>
                  <td>{new Date(s.submitted_at).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${s.status}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm submission</h3>
            <p>
              Are you sure {selected.map((s) => s.toUpperCase()).join(', ')}{' '}
              {selected.length > 1 ? 'are' : 'is'} filled?
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="ok-btn" onClick={confirmSubmit}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
