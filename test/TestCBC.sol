pragma solidity ^0.4.19;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/CashBetCoin.sol";

contract TestCBC{
  
  function testDeploy() public {
    CashBetCoin cbc = CashBetCoin(DeployedAddresses.CashBetCoin());
    Assert.equal(cbc.totalSupply(),
                 43000000000000000,
                 "Total supply should equal 430e6");
  }

}
