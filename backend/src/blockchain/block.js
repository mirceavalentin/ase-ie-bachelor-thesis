const SHA256 = require('crypto-js/sha256');

class Block {
  /**
   * @param {number} index - Position of the block in the chain
   * @param {string} previousHash - Hash of the previous block
   * @param {Array} votes - Array of Vote objects stored in this block
   */
  constructor(index, previousHash, votes = []) {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.votes = votes;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  /**
   * Compute the SHA-256 hash of the block's contents.
   * Any change to any field will produce a completely different hash,
   * which is how we detect tampering.
   */
  calculateHash() {
    return SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.votes)
    ).toString();
  }
}

module.exports = Block;
