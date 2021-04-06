import { keccakFromString } from "ethereumjs-util"

/**
 * Deterministic generation of sample data array
 * @param {number} length
 * @yields string
 * @example [ ...generateSampleData(60000)] will generate
 * an array of length 60000
 */
function* generateSampleData(length: number): Generator<string, void, unknown> {
  let initial = "snowfork"
  for (let i = 0; i < length; i++) {
    initial = keccakFromString(initial).toString("hex")
    yield initial
  }
}

export default generateSampleData
