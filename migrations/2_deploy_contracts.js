var Owned = artifacts.require("./Owned.sol");
var Remittance = artifacts.require("./Remittance.sol");

module.exports = function(deployer) {
  deployer.deploy(Owned);
  deployer.deploy(Remittance);
};
