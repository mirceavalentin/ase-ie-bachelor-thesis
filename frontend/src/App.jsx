import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import OrganiserHome from './pages/OrganiserHome';
import CreateElection from './pages/CreateElection';
import AccessElection from './pages/AccessElection';
import VoterHome from './pages/VoterHome';
import Vote from './pages/Vote';
import Verify from './pages/Verify';
import Results from './pages/Results';
import ResultsLookup from './pages/ResultsLookup';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <a href="/" className="logo">🗳️ BlockVote</a>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Welcome />} />

          {/* Organiser flow */}
          <Route path="/organiser" element={<OrganiserHome />} />
          <Route path="/elections/new" element={<CreateElection />} />
          <Route path="/elections/access" element={<AccessElection />} />

          {/* Voter flow */}
          <Route path="/voter" element={<VoterHome />} />
          <Route path="/vote/:electionId/:votingCode" element={<Vote />} />
          <Route path="/verify" element={<Verify />} />

          {/* Public */}
          <Route path="/results/lookup" element={<ResultsLookup />} />
          <Route path="/results/:electionId" element={<Results />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
