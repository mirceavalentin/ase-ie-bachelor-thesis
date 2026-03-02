import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import NormalBallot from '../components/ballots/NormalBallot';
import ApprovalBallot from '../components/ballots/ApprovalBallot';
import RankedBallot from '../components/ballots/RankedBallot';
import CorporateBallot from '../components/ballots/CorporateBallot';

export default function Vote() {
  const { electionId, votingCode } = useParams();
  const [election, setElection] = useState(null);
  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Vote state per type
  const [normalChoice, setNormalChoice] = useState(null);
  const [approvalChoices, setApprovalChoices] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [corporateChoice, setCorporateChoice] = useState(null);

  useEffect(() => {
    api.get(`/elections/${electionId}/voter/${votingCode}`)
      .then(res => {
        setElection(res.data.election);
        setVoter(res.data.voter);
        // Initialize ranking with candidates in default order
        if (res.data.election.type === 'ranked') {
          setRanking(res.data.election.candidates.map(c => c.id));
        }
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Invalid voting link');
      })
      .finally(() => setLoading(false));
  }, [electionId, votingCode]);

  const getVoteData = () => {
    switch (election.type) {
      case 'normal': return normalChoice;
      case 'approval': return approvalChoices;
      case 'ranked': return ranking;
      case 'corporate': return corporateChoice;
      default: return null;
    }
  };

  const canSubmit = () => {
    switch (election?.type) {
      case 'normal': return normalChoice !== null;
      case 'approval': return approvalChoices.length > 0;
      case 'ranked': return ranking.length === election.candidates.length;
      case 'corporate': return corporateChoice !== null;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/elections/${electionId}/vote`, {
        votingCode,
        voteData: getVoteData(),
      });
      setReceipt(res.data.receiptHash);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading ballot...</div>;

  if (error && !election) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
        <p style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</p>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    );
  }

  if (voter?.hasVoted) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
        <p style={{ fontSize: '2rem', marginBottom: 12 }}>✅</p>
        <p>You have already voted in this election.</p>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Use your receipt hash to verify your vote on the{' '}
          <a href="/verify" style={{ color: 'var(--accent)' }}>Verify page</a>.
        </p>
      </div>
    );
  }

  if (receipt) {
    return (
      <div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</p>
          <h2 style={{ marginBottom: 8 }}>Vote Cast Successfully!</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Your vote has been recorded on the blockchain
          </p>
        </div>

        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--accent)' }}>📋 Save These for Verification</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            You need both values to verify your vote later. Save them now!
          </p>
          <div className="receipt-box" style={{ marginTop: 0 }}>
            <div className="receipt-label">Election ID</div>
            <div className="receipt-hash">{electionId}</div>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(electionId)}
            >📋 Copy</button>
          </div>
          <div className="receipt-box">
            <div className="receipt-label">Your Verification Key (Receipt Hash)</div>
            <div className="receipt-hash">{receipt}</div>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(receipt)}
            >📋 Copy</button>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 16, textAlign: 'center' }}>
          You can verify your vote anytime on the{' '}
          <a href="/verify" style={{ color: 'var(--accent)' }}>Verify page</a>
          {' '}and inspect the full blockchain ledger.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">{election.title}</h1>
      <p className="page-subtitle">
        <span className="badge badge-type">{election.type}</span>
        {' · '}
        {election.candidates.length} candidates
      </p>

      {voter && (
        <div className="voter-info">
          <span className="voter-name">Welcome, {voter.name}</span>
          {election.type === 'corporate' && (
            <span className="voter-shares">{voter.shares} shares</span>
          )}
        </div>
      )}

      {error && <div className="msg msg-error">{error}</div>}

      <div className="card">
        {election.type === 'normal' && (
          <NormalBallot
            candidates={election.candidates}
            selected={normalChoice}
            onSelect={setNormalChoice}
          />
        )}
        {election.type === 'approval' && (
          <ApprovalBallot
            candidates={election.candidates}
            selected={approvalChoices}
            onSelect={setApprovalChoices}
            maxApprovals={election.maxApprovals}
          />
        )}
        {election.type === 'ranked' && (
          <RankedBallot
            candidates={election.candidates}
            ranking={ranking}
            onRankingChange={setRanking}
          />
        )}
        {election.type === 'corporate' && (
          <CorporateBallot
            candidates={election.candidates}
            selected={corporateChoice}
            onSelect={setCorporateChoice}
            voterShares={voter?.shares || 1}
          />
        )}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!canSubmit() || submitting}
        style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
      >
        {submitting ? 'Submitting...' : '🗳️ Cast Vote'}
      </button>
    </div>
  );
}
