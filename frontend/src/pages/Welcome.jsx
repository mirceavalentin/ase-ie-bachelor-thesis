import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="welcome">
      <h1>BlockVote</h1>
      <p>Transparent, tamper-proof elections powered by blockchain technology</p>
      <div className="welcome-buttons">
        <Link to="/organiser" className="welcome-card">
          <div className="icon">🏛️</div>
          <h2>I'm an Organiser</h2>
          <p>Create and manage elections, view results and voter turnout</p>
        </Link>
        <Link to="/voter" className="welcome-card">
          <div className="icon">🗳️</div>
          <h2>I'm a Voter</h2>
          <p>Verify your vote on the blockchain and audit the full ledger</p>
        </Link>
      </div>
    </div>
  );
}
