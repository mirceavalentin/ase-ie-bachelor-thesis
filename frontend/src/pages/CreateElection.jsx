import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const TYPES = [
  { id: 'normal', icon: '☝️', name: 'Normal', desc: 'Pick one candidate — most votes wins' },
  { id: 'approval', icon: '✅', name: 'Approval', desc: 'Approve multiple candidates — most approvals wins' },
  { id: 'ranked', icon: '🏅', name: 'Ranked', desc: 'Rank all candidates — Borda count scoring' },
  { id: 'corporate', icon: '🏢', name: 'Corporate', desc: 'Weighted by shares — CSV must include shares' },
];

export default function CreateElection() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [votersCsv, setVotersCsv] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxApprovals, setMaxApprovals] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addCandidate = () => setCandidates([...candidates, '']);
  const removeCandidate = (i) => setCandidates(candidates.filter((_, idx) => idx !== i));
  const updateCandidate = (i, val) => {
    const copy = [...candidates];
    copy[i] = val;
    setCandidates(copy);
  };

  const parseCsv = (csv) => {
    const lines = csv.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];

    // Check if first line is a header
    const firstLine = lines[0].toLowerCase();
    const startIdx = (firstLine.includes('name') || firstLine.includes('email')) ? 1 : 0;

    return lines.slice(startIdx).map(line => {
      const parts = line.split(',').map(s => s.trim());
      const voter = { name: parts[0], email: parts[1] };
      if (parts[2]) voter.shares = parseInt(parts[2], 10);
      return voter;
    }).filter(v => v.name && v.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const filteredCandidates = candidates.filter(c => c.trim());
    if (filteredCandidates.length < 2) {
      setError('At least 2 candidates are required');
      return;
    }

    const voters = parseCsv(votersCsv);
    if (voters.length === 0) {
      setError('At least 1 voter is required. Paste CSV: name,email');
      return;
    }

    if (type === 'corporate') {
      const missing = voters.filter(v => !v.shares || v.shares <= 0);
      if (missing.length > 0) {
        setError('Corporate type requires shares for each voter. CSV format: name,email,shares');
        return;
      }
    }

    setLoading(true);
    try {
      const body = {
        title,
        type,
        candidates: filteredCandidates,
        voters,
        deadline: new Date(deadline).toISOString(),
      };
      if (type === 'approval' && maxApprovals) {
        body.maxApprovals = parseInt(maxApprovals, 10);
      }

      const res = await api.post('/elections', body);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <h1 className="page-title">✅ Election Created!</h1>
        <p className="page-subtitle">Save your credentials below — you'll need them to manage this election</p>

        {/* Organiser credentials — prominent */}
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--accent)' }}>🔑 Your Organiser Credentials</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Save these! You need them to access your election dashboard. In production, these would be emailed to you.
          </p>
          <div className="receipt-box" style={{ marginTop: 0 }}>
            <div className="receipt-label">Election ID</div>
            <div className="receipt-hash">{result.election.id}</div>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(result.election.id)}
            >📋 Copy</button>
          </div>
          <div className="receipt-box">
            <div className="receipt-label">Organiser Key</div>
            <div className="receipt-hash">{result.organiserKey}</div>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(result.organiserKey)}
            >📋 Copy</button>
          </div>
        </div>

        <div className="card">
          <h3>{result.election.title}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            <span className="badge badge-type">{result.election.type}</span>
            {' · '}
            {result.election.voterCount} voters
            {' · '}
            Deadline: {new Date(result.election.deadline).toLocaleString()}
          </p>

          <h4 style={{ marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Voting Codes</h4>
          <table className="codes-table">
            <thead>
              <tr>
                <th>Voter</th>
                <th>Email</th>
                <th>Voting Link</th>
                {type === 'corporate' && <th>Shares</th>}
              </tr>
            </thead>
            <tbody>
              {result.votingCodes.map((vc, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font)' }}>{vc.name}</td>
                  <td style={{ fontFamily: 'var(--font)' }}>{vc.email}</td>
                  <td>
                    <a
                      href={`/vote/${result.election.id}/${vc.votingCode}`}
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      /vote/.../{vc.votingCode.slice(0, 8)}...
                    </a>
                  </td>
                  {type === 'corporate' && <td>{vc.shares}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => { setResult(null); setTitle(''); setType(''); setCandidates(['', '']); setVotersCsv(''); setDeadline(''); }}>
            Create Another
          </button>
          <a href="/organiser" className="btn btn-secondary">← Back to Organiser</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Create New Election</h1>
      <p className="page-subtitle">Set up your election — choose a type, add candidates and voters</p>

      {error && <div className="msg msg-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Election Title / Question</label>
            <input
              type="text"
              placeholder="e.g. Who should be the next Board Chair?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Election Type</label>
            <div className="type-grid">
              {TYPES.map(t => (
                <div
                  key={t.id}
                  className={`type-option ${type === t.id ? 'selected' : ''}`}
                  onClick={() => setType(t.id)}
                >
                  <div className="type-icon">{t.icon}</div>
                  <div className="type-name">{t.name}</div>
                  <div className="type-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {type === 'approval' && (
            <div className="form-group">
              <label>Max Approvals (optional)</label>
              <input
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
                value={maxApprovals}
                onChange={e => setMaxApprovals(e.target.value)}
              />
              <div className="hint">Limit how many candidates each voter can approve</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="form-group">
            <label>Candidates / Options</label>
            <div className="candidate-inputs">
              {candidates.map((c, i) => (
                <div key={i} className="candidate-row">
                  <input
                    type="text"
                    placeholder={`Candidate ${i + 1}`}
                    value={c}
                    onChange={e => updateCandidate(i, e.target.value)}
                  />
                  {candidates.length > 2 && (
                    <button type="button" className="remove-btn" onClick={() => removeCandidate(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addCandidate} style={{ marginTop: 8 }}>
              + Add Candidate
            </button>
          </div>
        </div>

        <div className="card">
          <div className="form-group">
            <label>Voters (CSV)</label>
            <textarea
              placeholder={type === 'corporate'
                ? 'name,email,shares\nJohn Doe,john@example.com,100\nJane Smith,jane@example.com,250'
                : 'name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com'}
              value={votersCsv}
              onChange={e => setVotersCsv(e.target.value)}
            />
            <div className="hint">
              {type === 'corporate'
                ? 'Format: name,email,shares (one voter per line)'
                : 'Format: name,email (one voter per line). Header row is optional.'}
            </div>
          </div>

          <div className="form-group">
            <label>Voting Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!title || !type || loading}
        >
          {loading ? 'Creating...' : '🗳️ Create Election'}
        </button>
      </form>
    </div>
  );
}
