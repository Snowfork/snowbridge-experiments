const { keccak } = require("./utils")

/**
 * Deterministic generation of sample data array
 * @param {number} length
 * @yields string
 * @example [ ...generateSampleData(60000)] will generate
 * an array of length 60000
 */
function* generateSampleData(length) {
  let initial = "snowfork"
  for (let i = 0; i < length; i++) {
    initial = keccak(initial).toString('hex')
    yield initial
  }
}

module.exports = generateSampleData