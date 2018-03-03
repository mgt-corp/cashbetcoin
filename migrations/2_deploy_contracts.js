var CBC = artifacts.require("CashBetCoin");

module.exports = function(deployer) {
    // This is where the initialization parameters go
    deployer.deploy(CBC, 43000000000000000);
};
