# Verification Solidity

This repository is for testing the gas costs of different verification strategies.

## Set up

```bash
npm install
```

## Tests

```bash
truffle develop # start a local blockchain
truffle test # run tests
```

Expected output

```bash
# Contract: Verification
#     list
#       ✓ should verify commitments against data set (46ms)
# Verification cost: 3827
#       ✓ should get expected verification gas expenditures (112ms)
#     merkle tree
#       ✓ should verify commitments against data set (91ms)
# Verification cost: 285999
#       ✓ should get expected verification gas expenditures (123ms)
```
