const { v4: uuidv4 } = require('uuid');
const Blockchain = require('../blockchain/blockchain');
const Vote = require('./vote');

// Supported election types
const ELECTION_TYPES = ['normal', 'approval', 'ranked', 'corporate'];

class Election {
  /**
   * @param {string} title - Name/title of the election
   * @param {string} type - One of: normal, approval, ranked, corporate
   * @param {Array<{id: string, name: string}>} candidates - List of candidates
   * @param {Array<{name: string, email: string, shares?: number}>} voters
   * @param {string} deadline - ISO date string for when voting closes
   * @param {object} options - Type-specific options (e.g. maxApprovals)
   */
  constructor(title, type, candidates, voters, deadline, options = {}) {
    this.id = uuidv4();
    this.organiserKey = uuidv4(); // Secret key for organiser access
    this.title = title;
    this.type = type;
    this.candidates = candidates.map((c, i) => ({
      id: c.id || `candidate_${i + 1}`,
      name: typeof c === 'string' ? c : c.name,
    }));
    this.deadline = new Date(deadline);
    this.createdAt = new Date().toISOString();
    this.status = 'active';

    // Type-specific options
    this.maxApprovals = options.maxApprovals || null; // For approval type

    // Each election has its own blockchain
    this.blockchain = new Blockchain();

    // Build voter registry: each voter gets a unique voting code
    // Map<votingCode, {name, email, hasVoted, shares}>
    this.voterRegistry = new Map();
    this.votingCodes = []; // Store codes for the creation response

    for (const voter of voters) {
      const code = uuidv4();
      this.voterRegistry.set(code, {
        name: voter.name,
        email: voter.email,
        hasVoted: false,
        shares: voter.shares || 1, // Default weight of 1
      });
      this.votingCodes.push({
        name: voter.name,
        email: voter.email,
        votingCode: code,
        shares: voter.shares || 1,
      });
    }
  }

  /**
   * Check if the election is still accepting votes.
   */
  isActive() {
    if (this.status === 'closed') return false;
    if (new Date() > this.deadline) {
      this.status = 'closed';
      return false;
    }
    return true;
  }

  /**
   * Cast a vote in this election.
   * For corporate type, the weight is automatically pulled from the voter registry.
   */
  castVote(votingCode, voteData) {
    // Check if election is still active
    if (!this.isActive()) {
      return { success: false, error: 'Election has ended' };
    }

    // Validate voting code
    const voter = this.voterRegistry.get(votingCode);
    if (!voter) {
      return { success: false, error: 'Invalid voting code' };
    }

    // Prevent double voting
    if (voter.hasVoted) {
      return { success: false, error: 'You have already voted in this election' };
    }

    // For corporate type, automatically attach the voter's weight
    let finalVoteData = voteData;
    if (this.type === 'corporate') {
      finalVoteData = {
        candidateId: voteData,
        weight: voter.shares,
      };
    }

    // Validate vote data against election type
    const validationError = this.validateVoteData(finalVoteData);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Create the vote object
    const vote = new Vote(votingCode, this.id, finalVoteData);

    if (!vote.isValid()) {
      return { success: false, error: 'Invalid vote data' };
    }

    // Add vote to blockchain as a new block
    this.blockchain.addBlock([vote]);

    // Mark voter as having voted
    voter.hasVoted = true;

    return {
      success: true,
      receiptHash: vote.receiptHash,
      message: 'Vote cast successfully. Save your receipt hash to verify your vote later.',
    };
  }

  /**
   * Validate that the vote data matches the election type.
   */
  validateVoteData(voteData) {
    const candidateIds = this.candidates.map((c) => c.id);

    switch (this.type) {
      case 'normal':
        if (!candidateIds.includes(voteData)) {
          return `Invalid candidate. Choose one of: ${candidateIds.join(', ')}`;
        }
        break;

      case 'approval':
        if (!Array.isArray(voteData) || voteData.length === 0) {
          return 'Approval voting requires an array of approved candidate IDs';
        }
        if (this.maxApprovals && voteData.length > this.maxApprovals) {
          return `You can approve at most ${this.maxApprovals} candidates`;
        }
        for (const id of voteData) {
          if (!candidateIds.includes(id)) {
            return `Invalid candidate ID: ${id}`;
          }
        }
        break;

      case 'ranked':
        if (!Array.isArray(voteData)) {
          return 'Ranked voting requires an ordered array of candidate IDs';
        }
        if (voteData.length !== candidateIds.length) {
          return `You must rank all ${candidateIds.length} candidates`;
        }
        for (const id of voteData) {
          if (!candidateIds.includes(id)) {
            return `Invalid candidate ID: ${id}`;
          }
        }
        // Check for duplicates
        if (new Set(voteData).size !== voteData.length) {
          return 'Each candidate must appear exactly once in the ranking';
        }
        break;

      case 'corporate':
        if (!voteData || !voteData.candidateId || !voteData.weight) {
          return 'Corporate voting requires {candidateId, weight}';
        }
        if (!candidateIds.includes(voteData.candidateId)) {
          return `Invalid candidate ID: ${voteData.candidateId}`;
        }
        if (typeof voteData.weight !== 'number' || voteData.weight <= 0) {
          return 'Weight must be a positive number';
        }
        break;

      default:
        return `Unknown election type: ${this.type}`;
    }

    return null;
  }

  /**
   * Tally votes and return results based on election type.
   */
  getResults() {
    const allVotes = this.blockchain.getAllVotes();

    switch (this.type) {
      case 'normal':
        return this.tallyNormal(allVotes);
      case 'approval':
        return this.tallyApproval(allVotes);
      case 'ranked':
        return this.tallyRanked(allVotes);
      case 'corporate':
        return this.tallyCorporate(allVotes);
      default:
        return { error: `Unknown election type: ${this.type}` };
    }
  }

  tallyNormal(votes) {
    const tally = {};
    this.candidates.forEach((c) => (tally[c.id] = { name: c.name, votes: 0 }));

    for (const vote of votes) {
      if (tally[vote.data]) {
        tally[vote.data].votes++;
      }
    }

    const sorted = Object.entries(tally)
      .map(([id, data]) => ({ candidateId: id, ...data }))
      .sort((a, b) => b.votes - a.votes);

    return {
      type: 'normal',
      totalVotes: votes.length,
      results: sorted,
      winner: sorted.length > 0 ? sorted[0] : null,
    };
  }

  tallyApproval(votes) {
    const tally = {};
    this.candidates.forEach((c) => (tally[c.id] = { name: c.name, approvals: 0 }));

    for (const vote of votes) {
      for (const candidateId of vote.data) {
        if (tally[candidateId]) {
          tally[candidateId].approvals++;
        }
      }
    }

    const sorted = Object.entries(tally)
      .map(([id, data]) => ({ candidateId: id, ...data }))
      .sort((a, b) => b.approvals - a.approvals);

    return {
      type: 'approval',
      totalVotes: votes.length,
      results: sorted,
      winner: sorted.length > 0 ? sorted[0] : null,
    };
  }

  tallyRanked(votes) {
    const tally = {};
    this.candidates.forEach((c) => (tally[c.id] = { name: c.name, points: 0 }));
    const n = this.candidates.length;

    for (const vote of votes) {
      const ranking = vote.data;
      for (let i = 0; i < ranking.length; i++) {
        const candidateId = ranking[i];
        if (tally[candidateId]) {
          tally[candidateId].points += (n - i);
        }
      }
    }

    const sorted = Object.entries(tally)
      .map(([id, data]) => ({ candidateId: id, ...data }))
      .sort((a, b) => b.points - a.points);

    return {
      type: 'ranked',
      method: 'borda_count',
      totalVotes: votes.length,
      results: sorted,
      winner: sorted.length > 0 ? sorted[0] : null,
    };
  }

  tallyCorporate(votes) {
    const tally = {};
    this.candidates.forEach((c) => (tally[c.id] = { name: c.name, weightedVotes: 0, rawVotes: 0 }));

    for (const vote of votes) {
      const { candidateId, weight } = vote.data;
      if (tally[candidateId]) {
        tally[candidateId].weightedVotes += weight;
        tally[candidateId].rawVotes++;
      }
    }

    const sorted = Object.entries(tally)
      .map(([id, data]) => ({ candidateId: id, ...data }))
      .sort((a, b) => b.weightedVotes - a.weightedVotes);

    return {
      type: 'corporate',
      totalVotes: votes.length,
      results: sorted,
      winner: sorted.length > 0 ? sorted[0] : null,
    };
  }

  getVoteCount() {
    return this.blockchain.getAllVotes().length;
  }

  /**
   * Return a safe summary of the election (without exposing voting codes).
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      candidates: this.candidates,
      voterCount: this.voterRegistry.size,
      votesCast: this.getVoteCount(),
      deadline: this.deadline.toISOString(),
      status: this.isActive() ? 'active' : 'closed',
      createdAt: this.createdAt,
      maxApprovals: this.maxApprovals,
    };
  }
}

module.exports = { Election, ELECTION_TYPES };
