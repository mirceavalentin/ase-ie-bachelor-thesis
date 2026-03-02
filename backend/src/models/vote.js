const SHA256 = require('crypto-js/sha256');

class Vote {
  /**
   * @param {string} voterId - The voter's identifier
   * @param {string} electionId - Which election this vote belongs to
   * @param {*} data - The actual vote choice (flexible per election type):
   *   Normal:     "candidateId"
   *   Approval:   ["candidateA", "candidateB"]
   *   Ranked:     ["1st", "2nd", "3rd"]
   *   Corporate:  { candidateId: "X", weight: 5 }
   */
  constructor(voterId, electionId, data) {
    this.voterId = voterId;
    this.electionId = electionId;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.receiptHash = this.generateReceipt();
  }

  /**
   * Generate a unique receipt hash for this vote.
   * This is the verification key the voter receives after casting.
   * It's derived from their voterId, electionId, timestamp, and a random salt
   * so that the receipt can't be guessed or forged.
   */
  generateReceipt() {
    const salt = Math.random().toString(36).substring(2, 15);
    return SHA256(
      this.voterId +
      this.electionId +
      this.timestamp +
      salt
    ).toString();
  }

  /**
   * Basic validation — all required fields must be present.
   */
  isValid() {
    return !!(this.voterId && this.electionId && this.data);
  }
}

module.exports = Vote;
