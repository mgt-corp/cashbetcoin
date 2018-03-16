// Copyright (c) 2018 CashBet Alderney Limited. All rights reserved.

var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
