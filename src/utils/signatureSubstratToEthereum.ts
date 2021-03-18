import web3 from "web3"

const recIdIncrement = 27

/**
 * Update signature format (Polkadot uses recovery IDs 0 or 1, Eth uses 27 or 28, so we need to add 27)
 * @param sig
 * @returns
 */
export function signatureSubstratToEthereum(sig: string): string {
  const recoveryId0 = web3.utils.hexToNumber(`0x${sig.slice(130)}`)
  const newRecoveryId0 = web3.utils.numberToHex(recoveryId0 + recIdIncrement)
  const res = sig.slice(0, 130).concat(newRecoveryId0.slice(2))
  return res
}
