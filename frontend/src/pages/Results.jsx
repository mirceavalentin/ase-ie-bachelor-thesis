import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function Results() {
  const { electionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/elections/${electionId}/results`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [electionId]);

  if (loading) return <div className="loading">Loading results...</div>;
  if (!data) return <div className="card">Election not found</div>;

  // Find max value for bar scaling
  const getMaxValue = () => {
    switch (data.type) {
      case 'normal': return Math.max(...data.results.map(r => r.votes), 1);
      case 'approval': return Math.max(...data.results.map(r => r.approvals), 1);
      case 'ranked': return Math.max(...data.results.map(r => r.points), 1);
      case 'corporate': return Math.max(...data.results.map(r => r.weightedVotes), 1);
      default: return 1;
    }
  };

  const getValue = (r) => {
    switch (data.type) {
      case 'normal': return r.votes;
      case 'approval': return r.approvals;
      case 'ranked': return r.points;
      case 'corporate': return r.weightedVotes;
      default: return 0;
    }
  };

  const getLabel = (r) => {
    switch (data.type) {
      case 'normal': return `${r.votes} vote${r.votes !== 1 ? 's' : ''}`;
      case 'approval': return `${r.approvals} approval${r.approvals !== 1 ? 's' : ''}`;
      case 'ranked': return `${r.points} point${r.points !== 1 ? 's' : ''}`;
      case 'corporate': return `${r.weightedVotes} weighted (${r.rawVotes} raw)`;
      default: return '';
    }
  };

  const maxVal = getMaxValue();

  return (
    <div>
      <h1 className="page-title">{data.electionTitle}</h1>
      <p className="page-subtitle">
        <span className="badge badge-type">{data.type}</span>
        {' '}
        <span className={`badge ${data.status === 'active' ? 'badge-active' : 'badge-closed'}`}>
          {data.status}
        </span>
        {' · '}
        {data.totalVotes} total vote{data.totalVotes !== 1 ? 's' : ''}
        {data.method && ` · Method: ${data.method.replace('_', ' ')}`}
      </p>

      <div className="card">
        {data.results.map((r, i) => (
          <div key={r.candidateId} className="result-bar-container">
            <div className="result-bar-header">
              <span className="name">
                {i === 0 && data.totalVotes > 0 ? '👑 ' : ''}{r.name}
              </span>
              <span className="count">{getLabel(r)}</span>
            </div>
            <div className="result-bar-track">
              <div
                className={`result-bar-fill ${i === 0 && data.totalVotes > 0 ? 'winner' : ''}`}
                style={{ width: `${(getValue(r) / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {data.winner && data.totalVotes > 0 && (
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--success)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {data.status === 'closed' ? 'Winner' : 'Currently Leading'}
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            🏆 {data.winner.name}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {getLabel(data.winner)}
          </p>
        </div>
      )}

      <Link to={`/elections/${electionId}`} className="btn btn-secondary" style={{ marginTop: 8 }}>
        ← Back to Election
      </Link>
    </div>
  );
}
