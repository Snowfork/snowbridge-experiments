# Verification Solidity

## Set up

The project uses [Hardhat](https://hardhat.org) as a development environment. The docs can be found [here](https://hardhat.org/getting-started). Hardhat doesn't require any globally installed node packages, and provides a modular task-based interface for setting up the development environment. See [hardhat plugins] for a list of open-source tools and integrations already available.

### Requirements

- Node (>= v14.0)
- Yarn (See note below on package management)

Typescript is included as a dependency of the project, so you won't need it installed globally.

**A note on node package managers**

Due to some dependency conflicts over the version of `typechain` used by `hardhat-typechain`, I've had some difficulties with the `npm` package manager. `Yarn` seems to resolve the conflict without any workarounds, so I recommend using it instead for this project.

### Running in Docker

The project includes a `.devcontainer` directory which can be used along with VSCode or GitHub Codespaces to create a fresh environment with everything already set up.

### Install Dependencies

In order to install the required project dependencies, run:

```bash
yarn install
```

## Testing

[Waffle](https://ethereum-waffle.readthedocs.io/) is injected into the runtime environment and provides a number of matchers based on `chai`. See the existing tests for an example of how to use it.

[Ethers](https://github.com/ethers-io/ethers.js/) is also available as a property `hre` in the global scope when running tests.

```bash
yarn test
```

## Tasks

Hardhat provides an integrated task-runner for adding on additional functionality to the build.

To find out which tasks are available, run `npx hardhat`.

Custom tasks are currently located in `./src/tasks/*`.
