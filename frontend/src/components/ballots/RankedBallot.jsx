export default function RankedBallot({ candidates, ranking, onRankingChange }) {
  const moveUp = (index) => {
    if (index === 0) return;
    const copy = [...ranking];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    onRankingChange(copy);
  };

  const moveDown = (index) => {
    if (index === ranking.length - 1) return;
    const copy = [...ranking];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    onRankingChange(copy);
  };

  // Build a lookup for candidate names
  const nameMap = {};
  candidates.forEach(c => { nameMap[c.id] = c.name; });

  return (
    <div className="ballot">
      <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.9rem' }}>
        Drag or use arrows to rank candidates (1 = best):
      </p>
      {ranking.map((id, i) => (
        <div key={id} className="ranked-item">
          <div className="rank-number">{i + 1}</div>
          <span className="rank-name">{nameMap[id]}</span>
          <div className="rank-arrows">
            <button
              type="button"
              onClick={() => moveUp(i)}
              disabled={i === 0}
              title="Move up"
            >▲</button>
            <button
              type="button"
              onClick={() => moveDown(i)}
              disabled={i === ranking.length - 1}
              title="Move down"
            >▼</button>
          </div>
        </div>
      ))}
    </div>
  );
}
