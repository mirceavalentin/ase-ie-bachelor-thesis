export default function ApprovalBallot({ candidates, selected, onSelect, maxApprovals }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onSelect(selected.filter(s => s !== id));
    } else {
      if (maxApprovals && selected.length >= maxApprovals) return;
      onSelect([...selected, id]);
    }
  };

  return (
    <div className="ballot">
      <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.9rem' }}>
        Approve as many as you want{maxApprovals ? ` (max ${maxApprovals})` : ''}:
      </p>
      {candidates.map(c => (
        <div
          key={c.id}
          className={`ballot-option ${selected.includes(c.id) ? 'approved' : ''}`}
          onClick={() => toggle(c.id)}
        >
          <div className="option-indicator checkbox-indicator" />
          <span className="option-name">{c.name}</span>
        </div>
      ))}
    </div>
  );
}
