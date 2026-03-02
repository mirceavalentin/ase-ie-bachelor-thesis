import { useState } from 'react';
import api from '../api/client';

export default function Verify() {
  const [electionId, setElectionId] = useState('');
  const [receiptHash, setReceiptHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLedger, setShowLedger] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setResult(null);
    setError('');
    setLoading(true);

    try {
      const res = await api.get(`/elections/${electionId}/verify/${receiptHash}`);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Vote not found — check your election ID and receipt hash');
      } else {
        setError(err.response?.data?.error || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Verify Your Vote</h1>
      <p className="page-subtitle">
        Enter your election ID and receipt hash to verify your vote and audit the full blockchain ledger
      </p>

      <form onSubmit={handleVerify}>
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
            <label>Receipt Hash (Verification Key)</label>
            <input
              type="text"
              placeholder="The hash you received after voting"
              value={receiptHash}
              onChange={e => setReceiptHash(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : '🔍 Verify Vote'}
          </button>
        </div>
      </form>

      {error && (
        <div className="verify-result error">
          <p style={{ fontWeight: 600 }}>❌ Vote Not Found</p>
          <p style={{ fontSize: '0.9rem', marginTop: 8 }}>{error}</p>
        </div>
      )}

      {result?.verified && (
        <>
          {/* Verification proof */}
          <div className="verify-result success">
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>✅ Vote Verified!</p>
            <p style={{ fontSize: '0.9rem', marginTop: 4, color: 'var(--text-muted)' }}>
              Your vote is recorded and tamper-proof on the blockchain
            </p>
            <div className="proof-grid">
              <div className="proof-item">
                <div className="proof-label">Election</div>
                <div className="proof-value">{result.proof.electionTitle}</div>
              </div>
              <div className="proof-item">
                <div className="proof-label">Block Index</div>
                <div className="proof-value">#{result.proof.blockIndex}</div>
              </div>
              <div className="proof-item">
                <div className="proof-label">Block Hash</div>
                <div className="proof-value">{result.proof.blockHash}</div>
              </div>
              <div className="proof-item">
                <div className="proof-label">Vote Timestamp</div>
                <div className="proof-value">{new Date(result.proof.voteTimestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Election info */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Election Info</h3>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{result.electionInfo.totalVotes}</div>
                <div className="stat-label">Total Votes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{result.electionInfo.totalVoters}</div>
                <div className="stat-label">Registered Voters</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: result.chainIntegrity.valid ? 'var(--success)' : 'var(--danger)' }}>
                  {result.chainIntegrity.valid ? '✓ Valid' : '✕ Broken'}
                </div>
                <div className="stat-label">Chain Integrity</div>
              </div>
            </div>
          </div>

          {/* Full blockchain ledger */}
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>🔗 Full Blockchain Ledger</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowLedger(!showLedger)}
              >
                {showLedger ? 'Hide' : 'Show'} Ledger
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              This is the complete, unmodified blockchain. You can independently verify that all hashes
              are correct and no votes have been tampered with.
            </p>

            {showLedger && (
              <div className="ledger">
                {result.blockchain.map((block, i) => (
                  <div key={i} className="ledger-block">
                    <div className="ledger-block-header">
                      <span className="ledger-block-index">Block #{block.index}</span>
                      <span className="ledger-block-time">
                        {new Date(block.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="ledger-block-field">
                      <span className="ledger-label">Hash</span>
                      <span className="ledger-value">{block.hash}</span>
                    </div>
                    <div className="ledger-block-field">
                      <span className="ledger-label">Prev Hash</span>
                      <span className="ledger-value">{block.previousHash}</span>
                    </div>
                    {block.votes.length > 0 && (
                      <div className="ledger-block-field">
                        <span className="ledger-label">Votes</span>
                        <span className="ledger-value">{block.votes.length} vote(s)</span>
                      </div>
                    )}
                    {block.votes.length === 0 && (
                      <div className="ledger-block-field">
                        <span className="ledger-label">Type</span>
                        <span className="ledger-value">Genesis Block</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showLedger && (
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const json = JSON.stringify(result.blockchain, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `blockchain_${electionId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📥 Download Full Ledger (JSON)
                </button>
              </div>
            )}
          </div>

          {/* Link to results */}
          <div style={{ marginTop: 16 }}>
            <a href={`/results/${result.proof.electionId}`} className="btn btn-primary">
              📊 View Results
            </a>
          </div>
        </>
      )}
    </div>
  );
}
