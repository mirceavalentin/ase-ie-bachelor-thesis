const Block = require('./block');

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  /**
   * The genesis block is the first block in the chain.
   * It has no votes and a zeroed-out previous hash.
   */
  createGenesisBlock() {
    return new Block(0, '0', []);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Create a new block containing the given votes and append it to the chain.
   * The new block's previousHash points to the latest block's hash,
   * forming the unbreakable chain.
   */
  addBlock(votes) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      previousBlock.index + 1,
      previousBlock.hash,
      votes
    );
    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Walk the entire chain and verify two things for each block:
   * 1. The block's stored hash matches a fresh recalculation
   * 2. The block's previousHash matches the actual previous block's hash
   *
   * If either check fails, the chain has been tampered with.
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Recalculate hash and compare
      if (current.hash !== current.calculateHash()) {
        return {
          valid: false,
          error: `Block ${i} hash mismatch — data has been tampered with`,
          blockIndex: i,
        };
      }

      // Check chain link
      if (current.previousHash !== previous.hash) {
        return {
          valid: false,
          error: `Block ${i} chain link broken — previousHash does not match`,
          blockIndex: i,
        };
      }
    }

    return { valid: true, blockCount: this.chain.length };
  }

  /**
   * Search every block in the chain for a vote with the given receipt hash.
   * Returns the vote and the block it's in, or null if not found.
   */
  findVoteByReceipt(receiptHash) {
    for (const block of this.chain) {
      for (const vote of block.votes) {
        if (vote.receiptHash === receiptHash) {
          return {
            vote,
            blockIndex: block.index,
            blockHash: block.hash,
            timestamp: block.timestamp,
          };
        }
      }
    }
    return null;
  }

  /**
   * Collect all votes from every block in the chain.
   */
  getAllVotes() {
    const votes = [];
    for (const block of this.chain) {
      votes.push(...block.votes);
    }
    return votes;
  }
}

module.exports = Blockchain;
