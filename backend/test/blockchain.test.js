/**
 * Blockchain Voting Platform — Test Script
 *
 * Tests the core blockchain, vote, and election logic without the HTTP layer.
 * Run with: npm test
 */

const Block = require('../src/blockchain/block');
const Blockchain = require('../src/blockchain/blockchain');
const Vote = require('../src/models/vote');
const { Election } = require('../src/models/election');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// ─── Test 1: Block hashing ──────────────────────────────────────────────────

console.log('\n📦 Test 1: Block Hashing');
const block = new Block(1, 'abc123', [{ data: 'test' }]);
assert(typeof block.hash === 'string' && block.hash.length === 64, 'Block has a 64-char hex hash');
assert(block.hash === block.calculateHash(), 'Hash matches recalculation');
assert(block.previousHash === 'abc123', 'Previous hash is stored correctly');

// ─── Test 2: Blockchain creation & validation ───────────────────────────────

console.log('\n⛓️  Test 2: Blockchain Creation & Validation');
const chain = new Blockchain();
assert(chain.chain.length === 1, 'Chain starts with genesis block');
assert(chain.chain[0].previousHash === '0', 'Genesis block has previousHash of "0"');

chain.addBlock([{ data: 'vote1' }]);
chain.addBlock([{ data: 'vote2' }]);
assert(chain.chain.length === 3, 'Chain has 3 blocks after adding 2');

const validation = chain.isChainValid();
assert(validation.valid === true, 'Chain is valid');

// ─── Test 3: Tamper detection ───────────────────────────────────────────────

console.log('\n🔓 Test 3: Tamper Detection');
const tamperChain = new Blockchain();
tamperChain.addBlock([{ data: 'honest vote' }]);
tamperChain.addBlock([{ data: 'another vote' }]);

// Tamper with block 1
tamperChain.chain[1].votes = [{ data: 'FRAUDULENT VOTE' }];
const tamperResult = tamperChain.isChainValid();
assert(tamperResult.valid === false, 'Tampered chain is detected as invalid');
assert(tamperResult.blockIndex === 1, 'Tampered block index is correctly identified');

// ─── Test 4: Vote receipt generation ────────────────────────────────────────

console.log('\n🎫 Test 4: Vote Receipts');
const vote1 = new Vote('voter1', 'election1', 'candidateA');
const vote2 = new Vote('voter1', 'election1', 'candidateA');
assert(typeof vote1.receiptHash === 'string', 'Vote has a receipt hash');
assert(vote1.receiptHash !== vote2.receiptHash, 'Two votes produce different receipts (random salt)');
assert(vote1.isValid() === true, 'Valid vote passes validation');

const badVote = new Vote('', 'election1', 'candidateA');
assert(badVote.isValid() === false, 'Vote without voterId fails validation');

// ─── Test 5: Election — Normal voting ───────────────────────────────────────

console.log('\n🗳️  Test 5: Normal Election');
const normalElection = new Election(
  'Board Chair Vote',
  'normal',
  ['Alice', 'Bob', 'Charlie'],
  [
    { name: 'Voter 1', email: 'v1@test.com' },
    { name: 'Voter 2', email: 'v2@test.com' },
    { name: 'Voter 3', email: 'v3@test.com' },
  ],
  '2026-12-31T23:59:59Z'
);

assert(normalElection.candidates.length === 3, 'Election has 3 candidates');
assert(normalElection.voterRegistry.size === 3, 'Election has 3 registered voters');
assert(normalElection.isActive() === true, 'Election is active');

// Cast votes
const codes = normalElection.votingCodes;
const r1 = normalElection.castVote(codes[0].votingCode, 'candidate_1');
assert(r1.success === true, 'Voter 1 casts vote successfully');
assert(typeof r1.receiptHash === 'string', 'Voter 1 receives a receipt hash');

const r2 = normalElection.castVote(codes[1].votingCode, 'candidate_1');
assert(r2.success === true, 'Voter 2 casts vote successfully');

const r3 = normalElection.castVote(codes[2].votingCode, 'candidate_2');
assert(r3.success === true, 'Voter 3 casts vote successfully');

// Double vote prevention
const rDup = normalElection.castVote(codes[0].votingCode, 'candidate_2');
assert(rDup.success === false, 'Double voting is prevented');

// Invalid code
const rBad = normalElection.castVote('fake-code', 'candidate_1');
assert(rBad.success === false, 'Invalid voting code is rejected');

// Results
const results = normalElection.getResults();
assert(results.totalVotes === 3, 'Total votes is 3');
assert(results.winner.candidateId === 'candidate_1', 'Alice (candidate_1) wins with 2 votes');
assert(results.winner.votes === 2, 'Winner has 2 votes');

// Vote count
assert(normalElection.getVoteCount() === 3, 'Vote count is 3');

// Verify receipt
const proof = normalElection.blockchain.findVoteByReceipt(r1.receiptHash);
assert(proof !== null, 'Receipt hash can be found in blockchain');
assert(proof.blockIndex > 0, 'Vote is in a real block (not genesis)');

// Chain validation
const chainValid = normalElection.blockchain.isChainValid();
assert(chainValid.valid === true, 'Election blockchain is valid');

// ─── Test 6: Election — Approval voting ─────────────────────────────────────

console.log('\n✅ Test 6: Approval Election');
const approvalElection = new Election(
  'Committee Selection',
  'approval',
  ['Alice', 'Bob', 'Charlie'],
  [
    { name: 'Voter 1', email: 'v1@test.com' },
    { name: 'Voter 2', email: 'v2@test.com' },
  ],
  '2026-12-31T23:59:59Z'
);

const aCodes = approvalElection.votingCodes;
const ar1 = approvalElection.castVote(aCodes[0].votingCode, ['candidate_1', 'candidate_3']);
assert(ar1.success === true, 'Approval vote with multiple candidates succeeds');

const ar2 = approvalElection.castVote(aCodes[1].votingCode, ['candidate_1']);
assert(ar2.success === true, 'Approval vote with single candidate succeeds');

const aResults = approvalElection.getResults();
assert(aResults.results[0].candidateId === 'candidate_1', 'Alice has most approvals');
assert(aResults.results[0].approvals === 2, 'Alice has 2 approvals');

// ─── Test 7: Election — Ranked voting ───────────────────────────────────────

console.log('\n🏅 Test 7: Ranked Election (Borda Count)');
const rankedElection = new Election(
  'Best Language',
  'ranked',
  ['Rust', 'Python', 'JavaScript'],
  [
    { name: 'Dev 1', email: 'd1@test.com' },
    { name: 'Dev 2', email: 'd2@test.com' },
  ],
  '2026-12-31T23:59:59Z'
);

const rCodes = rankedElection.votingCodes;
rankedElection.castVote(rCodes[0].votingCode, ['candidate_1', 'candidate_3', 'candidate_2']);
rankedElection.castVote(rCodes[1].votingCode, ['candidate_3', 'candidate_1', 'candidate_2']);

const rResults = rankedElection.getResults();
assert(rResults.method === 'borda_count', 'Uses Borda count method');
assert(rResults.totalVotes === 2, 'Total ranked votes is 2');

// ─── Test 8: Vote data validation ──────────────────────────────────────────

console.log('\n🛡️  Test 8: Vote Data Validation');
const valElection = new Election(
  'Validation Test',
  'normal',
  ['A', 'B'],
  [{ name: 'V1', email: 'v1@test.com' }],
  '2026-12-31T23:59:59Z'
);

const vCode = valElection.votingCodes[0].votingCode;
const vr = valElection.castVote(vCode, 'nonexistent_candidate');
assert(vr.success === false, 'Invalid candidate ID is rejected');
assert(vr.error.includes('Invalid candidate'), 'Error message mentions invalid candidate');

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
