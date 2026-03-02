import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResultsLookup() {
  const [electionId, setElectionId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (electionId.trim()) {
      navigate(`/results/${electionId.trim()}`);
    }
  };

  return (
    <div>
      <h1 className="page-title">View Election Results</h1>
      <p className="page-subtitle">Enter the Election ID to view results</p>

      <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn btn-primary">📊 View Results</button>
        </div>
      </form>
    </div>
  );
}
