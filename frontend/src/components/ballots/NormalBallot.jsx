export default function NormalBallot({ candidates, selected, onSelect }) {
  return (
    <div className="ballot">
      <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.9rem' }}>
        Select one candidate:
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
