import { Link } from 'react-router-dom';

export default function VoterHome() {
  return (
    <div className="welcome">
      <h1>Voter Panel</h1>
      <p>Verify your vote and audit the blockchain ledger</p>
      <div className="welcome-buttons">
        <Link to="/verify" className="welcome-card">
          <div className="icon">🔍</div>
          <h2>Verify My Vote</h2>
          <p>Check that your vote is recorded on the blockchain and audit the full ledger</p>
        </Link>
        <Link to="/results/lookup" className="welcome-card">
          <div className="icon">📊</div>
          <h2>View Results</h2>
          <p>See election results and vote counts</p>
        </Link>
      </div>
    </div>
  );
}
