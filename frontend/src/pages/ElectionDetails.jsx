import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function ElectionDetails() {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/elections/${id}`),
      api.get(`/elections/${id}/chain/validate`),
    ])
      .then(([elRes, valRes]) => {
        setElection(elRes.data.election);
        setValidation(valRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!election) return <div className="card">Election not found</div>;

  const turnout = election.voterCount > 0
    ? Math.round((election.votesCast / election.voterCount) * 100)
    : 0;

  return (
    <div>
      <h1 className="page-title">{election.title}</h1>
      <p className="page-subtitle">
        <span className="badge badge-type">{election.type}</span>
        {' '}
        <span className={`badge ${election.status === 'active' ? 'badge-active' : 'badge-closed'}`}>
          {election.status}
        </span>
      </p>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{election.votesCast}</div>
          <div className="stat-label">Votes Cast</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{election.voterCount}</div>
          <div className="stat-label">Total Voters</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{turnout}%</div>
          <div className="stat-label">Turnout</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: validation?.valid ? 'var(--success)' : 'var(--danger)' }}>
            {validation?.valid ? '✓' : '✕'}
          </div>
          <div className="stat-label">Chain Valid</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Candidates</h3>
        {election.candidates.map(c => (
          <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            {c.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({c.id})</span>
          </div>
        ))}
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Deadline: {new Date(election.deadline).toLocaleString()}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Created: {new Date(election.createdAt).toLocaleString()}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to={`/results/${id}`} className="btn btn-primary">📊 View Results</Link>
        <Link to="/elections" className="btn btn-secondary">← Back</Link>
      </div>
    </div>
  );
}
