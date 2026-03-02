import { Link } from 'react-router-dom';

export default function OrganiserHome() {
  return (
    <div className="welcome">
      <h1>Organiser Panel</h1>
      <p>Create a new election or access an ongoing one</p>
      <div className="welcome-buttons">
        <Link to="/elections/new" className="welcome-card">
          <div className="icon">✨</div>
          <h2>Create Election</h2>
          <p>Set up a new election with candidates, voters, and a deadline</p>
        </Link>
        <Link to="/elections/access" className="welcome-card">
          <div className="icon">🔑</div>
          <h2>Access Ongoing Election</h2>
          <p>Enter your Election ID and organiser key to manage your election</p>
        </Link>
      </div>
    </div>
  );
}
