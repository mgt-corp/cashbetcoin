var CBC = artifacts.require("CashBetCoin");
var CBC2 = artifacts.require("CashBetCoin2");

module.exports = function(deployer) {
    // This is where the initialization parameters go
    deployer.deploy(CBC, 43000000000000000);
    deployer.deploy(CBC2, 0);
};
