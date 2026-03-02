import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AccessElection() {
  const [electionId, setElectionId] = useState('');
  const [organiserKey, setOrganiserKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const handleAccess = async (e) => {
    e.preventDefault();
    setError('');
    setData(null);
    setLoading(true);

    try {
      const res = await api.post(`/elections/${electionId}/access`, { organiserKey });
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Invalid organiser key');
      } else if (err.response?.status === 404) {
        setError('Election not found');
      } else {
        setError(err.response?.data?.error || 'Failed to access election');
      }
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    const el = data.election;
    const turnout = el.voterCount > 0
      ? Math.round((el.votesCast / el.voterCount) * 100)
      : 0;

    return (
      <div>
        <h1 className="page-title">{el.title}</h1>
        <p className="page-subtitle">
          <span className="badge badge-type">{el.type}</span>
          {' '}
          <span className={`badge ${el.status === 'active' ? 'badge-active' : 'badge-closed'}`}>
            {el.status}
          </span>
        </p>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{el.votesCast}</div>
            <div className="stat-label">Votes Cast</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{el.voterCount}</div>
            <div className="stat-label">Total Voters</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{turnout}%</div>
            <div className="stat-label">Turnout</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Candidates</h3>
          {el.candidates.map(c => (
            <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              {c.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({c.id})</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Voting Codes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Share these links with your voters (in production, these are sent via email)
          </p>
          <table className="codes-table">
            <thead>
              <tr>
                <th>Voter</th>
                <th>Email</th>
                <th>Voting Link</th>
                {el.type === 'corporate' && <th>Shares</th>}
              </tr>
            </thead>
            <tbody>
              {data.votingCodes.map((vc, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font)' }}>{vc.name}</td>
                  <td style={{ fontFamily: 'var(--font)' }}>{vc.email}</td>
                  <td>
                    <a
                      href={`/vote/${el.id}/${vc.votingCode}`}
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      /vote/.../{vc.votingCode.slice(0, 8)}...
                    </a>
                  </td>
                  {el.type === 'corporate' && <td>{vc.shares}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Deadline: {new Date(el.deadline).toLocaleString()}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Created: {new Date(el.createdAt).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to={`/results/${el.id}`} className="btn btn-primary">📊 View Results</Link>
          <Link to="/organiser" className="btn btn-secondary">← Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Access Ongoing Election</h1>
      <p className="page-subtitle">
        Enter the Election ID and organiser key you received when creating the election
      </p>

      {error && <div className="msg msg-error">{error}</div>}

      <form onSubmit={handleAccess}>
        <div className="card">
          <div className="form-group">
            <label>Election ID</label>
            <input
              type="text"
              placeholder="e.g. 126bcbed-b5ef-4b3c-b3c9-5b3aac5921fc"
              value={electionId}
              onChange={e => setElectionId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Organiser Key</label>
            <input
              type="text"
              placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              value={organiserKey}
              onChange={e => setOrganiserKey(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Accessing...' : '🔑 Access Election'}
          </button>
        </div>
      </form>
    </div>
  );
}
