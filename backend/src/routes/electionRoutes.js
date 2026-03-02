const express = require('express');
const router = express.Router();
const { Election, ELECTION_TYPES } = require('../models/election');

// In-memory election store — Map<electionId, Election>
const elections = new Map();

// ─── Create a new election ──────────────────────────────────────────────────

router.post('/', (req, res) => {
  const { title, type, candidates, voters, deadline, maxApprovals } = req.body;

  // Validate required fields
  if (!title || !type || !candidates || !voters || !deadline) {
    return res.status(400).json({
      error: 'Missing required fields: title, type, candidates, voters, deadline',
    });
  }

  if (!ELECTION_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid election type. Must be one of: ${ELECTION_TYPES.join(', ')}`,
    });
  }

  if (!Array.isArray(candidates) || candidates.length < 2) {
    return res.status(400).json({ error: 'At least 2 candidates are required' });
  }

  if (!Array.isArray(voters) || voters.length === 0) {
    return res.status(400).json({ error: 'At least 1 voter is required' });
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
    return res.status(400).json({ error: 'Deadline must be a valid future date' });
  }

  if (type === 'corporate') {
    const missingShares = voters.filter(v => !v.shares || v.shares <= 0);
    if (missingShares.length > 0) {
      return res.status(400).json({
        error: 'Corporate elections require a positive "shares" value for each voter',
      });
    }
  }

  const options = {};
  if (maxApprovals) options.maxApprovals = maxApprovals;

  const election = new Election(title, type, candidates, voters, deadline, options);
  elections.set(election.id, election);

  // Return election info + organiser key (would be emailed in production)
  res.status(201).json({
    message: 'Election created successfully',
    election: election.toJSON(),
    organiserKey: election.organiserKey,
    votingCodes: election.votingCodes,
  });
});

// ─── Access election as organiser (requires organiserKey) ───────────────────

router.post('/:id/access', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  const { organiserKey } = req.body;
  if (!organiserKey || organiserKey !== election.organiserKey) {
    return res.status(403).json({ error: 'Invalid organiser key' });
  }

  // Return full election details including voting codes
  res.json({
    election: election.toJSON(),
    votingCodes: election.votingCodes,
  });
});

// ─── Get public election info (no key needed — just title, type, candidates) ─

router.get('/:id/public', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  res.json({
    id: election.id,
    title: election.title,
    type: election.type,
    candidates: election.candidates,
    votesCast: election.getVoteCount(),
    voterCount: election.voterRegistry.size,
    deadline: election.deadline.toISOString(),
    status: election.isActive() ? 'active' : 'closed',
    maxApprovals: election.maxApprovals,
  });
});

// Export both the router and the elections map (for use in vote routes)
module.exports = { electionRouter: router, elections };
