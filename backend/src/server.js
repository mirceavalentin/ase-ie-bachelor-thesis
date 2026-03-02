const express = require('express');
const cors = require('cors');

const { electionRouter } = require('./routes/electionRoutes');
const { voteRouter } = require('./routes/voteRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use('/api/elections', electionRouter);
app.use('/api/elections', voteRouter);

// ─── Health check ───────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Blockchain Voting Platform',
    timestamp: new Date().toISOString(),
  });
});

// ─── Start server ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🗳️  Blockchain Voting Platform — Backend`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
