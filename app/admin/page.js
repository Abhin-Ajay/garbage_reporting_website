'use client';
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div className="container">Loading...</div>;
  if (!session) {
    return (
      <div className="login-card">
        <h1>Admin Login</h1>
        <button className="google-btn" onClick={() => signIn('google')}>
          Login with NITC email ID
        </button>
      </div>
    );
  }
  if (!session.isAdmin) {
    return (
      <div className="login-card">
        <h1>Access denied</h1>
        <p>Your account does not have admin access.</p>
      </div>
    );
  }
  return <AdminDashboard />;
}

function AdminDashboard() {
  const [bins, setBins] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [newBinName, setNewBinName] = useState('');
  const [editing, setEditing] = useState({});

  const load = async () => {
    const [binsRes, subsRes] = await Promise.all([
      fetch('/api/admin/bins'),
      fetch('/api/admin/submissions'),
    ]);
    setBins((await binsRes.json()).bins || []);
    setSubmissions((await subsRes.json()).submissions || []);
  };

  useEffect(() => {
    load();
  }, []);

  const saveRemark = async (name) => {
    const remark = editing[name];
    await fetch('/api/admin/remarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, remark }),
    });
    await load();
  };

  const addBin = async () => {
    if (!newBinName.trim()) return;
    await fetch('/api/admin/bins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBinName.trim().toLowerCase(), remark: 'this is the first basket' }),
    });
    setNewBinName('');
    await load();
  };

  const markCollected = async (id) => {
    await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'collected' }),
    });
    await load();
  };

  return (
    <div className="container">
      <div className="hero">
        <h1>Admin Panel</h1>
        <p>Manage bins, remarks, and collection status</p>
      </div>

      <div className="card">
        <h2>Bins &amp; remarks</h2>
        {bins.map((bin) => (
          <div key={bin.name} style={{ marginBottom: 14 }}>
            <strong>{bin.name.toUpperCase()}</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input
                style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
                defaultValue={bin.remark}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, [bin.name]: e.target.value }))
                }
              />
              <button className="submit-btn" style={{ padding: '8px 16px' }} onClick={() => saveRemark(bin.name)}>
                Save
              </button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <input
            placeholder="e.g. bin11"
            value={newBinName}
            onChange={(e) => setNewBinName(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button className="submit-btn" style={{ padding: '8px 16px' }} onClick={addBin}>
            Add bin
          </button>
        </div>
      </div>

      <div className="card">
        <h2>All submissions</h2>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Bin</th>
              <th>Submitted at</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{s.bin_name.toUpperCase()}</td>
                <td>{new Date(s.submitted_at).toLocaleString()}</td>
                <td>
                  <span className={`status-pill ${s.status}`}>{s.status}</span>
                </td>
                <td>
                  {s.status === 'pending' && (
                    <button
                      className="submit-btn"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => markCollected(s.id)}
                    >
                      Mark collected
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
