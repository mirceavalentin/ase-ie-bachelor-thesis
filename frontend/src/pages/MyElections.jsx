import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function MyElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/elections')
      .then(res => setElections(res.data.elections))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading elections...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">My Elections</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage your elections</p>
        </div>
        <Link to="/elections/new" className="btn btn-primary">+ New Election</Link>
      </div>

      {elections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📭</p>
          <p style={{ color: 'var(--text-muted)' }}>No elections yet</p>
          <Link to="/elections/new" className="btn btn-primary" style={{ marginTop: 16 }}>
            Create your first election
          </Link>
        </div>
      ) : (
        <div className="election-list">
          {elections.map(el => (
            <Link to={`/elections/${el.id}`} key={el.id} className="election-item">
              <div className="election-info">
                <h3>{el.title}</h3>
                <p>
                  <span className="badge badge-type">{el.type}</span>
                  {' · '}
                  {el.votesCast}/{el.voterCount} votes
                  {' · '}
                  Deadline: {new Date(el.deadline).toLocaleDateString()}
                </p>
              </div>
              <span className={`badge ${el.status === 'active' ? 'badge-active' : 'badge-closed'}`}>
                {el.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
