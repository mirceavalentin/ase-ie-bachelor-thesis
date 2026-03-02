export default function CorporateBallot({ candidates, selected, onSelect, voterShares }) {
  return (
    <div className="ballot">
      <div className="voter-info">
        <span className="voter-name">Your vote weight</span>
        <span className="voter-shares">{voterShares} shares</span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.9rem' }}>
        Select one candidate — your vote will count as {voterShares} weighted votes:
      </p>
      {candidates.map(c => (
        <div
          key={c.id}
          className={`ballot-option ${selected === c.id ? 'selected' : ''}`}
          onClick={() => onSelect(c.id)}
        >
          <div className="option-indicator" />
          <span className="option-name">{c.name}</span>
        </div>
      ))}
    </div>
  );
}
