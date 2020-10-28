var Verification = artifacts.require("Verification");

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(Verification);
}
