const express = require('express');
const router = express.Router();
const { elections } = require('./electionRoutes');

// ─── Cast a vote ────────────────────────────────────────────────────────────

router.post('/:id/vote', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  const { votingCode, voteData } = req.body;
  if (!votingCode || voteData === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: votingCode, voteData',
    });
  }

  const result = election.castVote(votingCode, voteData);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({
    message: result.message,
    receiptHash: result.receiptHash,
    electionId: election.id,
  });
});

// ─── Verify vote + return full blockchain for independent audit ─────────────

router.get('/:id/verify/:receiptHash', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  const proof = election.blockchain.findVoteByReceipt(req.params.receiptHash);

  if (!proof) {
    return res.status(404).json({
      verified: false,
      error: 'No vote found with this receipt hash',
    });
  }

  // Return the proof AND the full blockchain so the voter can audit independently
  const chainValidation = election.blockchain.isChainValid();

  res.json({
    verified: true,
    proof: {
      electionId: election.id,
      electionTitle: election.title,
      blockIndex: proof.blockIndex,
      blockHash: proof.blockHash,
      blockTimestamp: proof.timestamp,
      voteTimestamp: proof.vote.timestamp,
    },
    // Full transparency: give them the entire ledger
    chainIntegrity: chainValidation,
    blockchain: election.blockchain.chain,
    electionInfo: {
      title: election.title,
      type: election.type,
      candidates: election.candidates,
      totalVotes: election.getVoteCount(),
      totalVoters: election.voterRegistry.size,
      status: election.isActive() ? 'active' : 'closed',
      deadline: election.deadline.toISOString(),
    },
  });
});

// ─── Get the full blockchain for independent audit (public) ─────────────────

router.get('/:id/chain', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  res.json({
    electionId: election.id,
    electionTitle: election.title,
    chain: election.blockchain.chain,
    validation: election.blockchain.isChainValid(),
  });
});

// ─── Get election results (public) ──────────────────────────────────────────

router.get('/:id/results', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  const results = election.getResults();
  res.json({
    electionId: election.id,
    electionTitle: election.title,
    status: election.isActive() ? 'active' : 'closed',
    ...results,
  });
});

// ─── Get vote count (public) ────────────────────────────────────────────────

router.get('/:id/count', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  res.json({
    electionId: election.id,
    electionTitle: election.title,
    votesCast: election.getVoteCount(),
    totalVoters: election.voterRegistry.size,
  });
});

// ─── Get voter info by voting code (for the vote page) ──────────────────────

router.get('/:id/voter/:votingCode', (req, res) => {
  const election = elections.get(req.params.id);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  const voter = election.voterRegistry.get(req.params.votingCode);
  if (!voter) {
    return res.status(404).json({ error: 'Invalid voting code' });
  }

  res.json({
    election: {
      id: election.id,
      title: election.title,
      type: election.type,
      candidates: election.candidates,
      deadline: election.deadline.toISOString(),
      status: election.isActive() ? 'active' : 'closed',
      maxApprovals: election.maxApprovals,
    },
    voter: {
      name: voter.name,
      hasVoted: voter.hasVoted,
      shares: voter.shares,
    },
  });
});

module.exports = { voteRouter: router };
