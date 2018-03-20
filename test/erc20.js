// Copyright (c) 2018 CashBet Alderney Limited. All rights reserved.

const expect = require('chai').expect
const CashBetCoin = artifacts.require('CashBetCoin')
const utils = require('./utils')
const BigNumber = web3.BigNumber

const TOTAL_SUPPLY = utils.tokenAmtStr(430e6)

let deployed = null
let cbc = null
let accounts = null
let owner = null
let ownerBalance = null
let employee = null
let amount = null
let balance1 = null
let balance2 = null
let account_one = null
let account_one_starting_balance = null
let account_one_ending_balance = null
let account_two = null
let account_two_starting_balance = null
account_two_ending_balance = null

contract('ERC20 Functions', function(accounts) {

  beforeEach(async function() {
    cbc =  await CashBetCoin.deployed()
  })

  it('should have an original balance of 430e6 coins', async () => {
    owner = accounts[0]
    ownerBalance = (await cbc.balanceOf(owner)).toNumber()
    assert.equal(ownerBalance, new BigNumber(TOTAL_SUPPLY), 'The owner balance should initially be 430 ')
  })

  it('should have 8 decimal places', async function() {
    const decimals = await cbc.decimals()
    assert.equal(decimals, 8)
  })

  it('should initialize the contract with CBC as the symbol name', async () => {
    const symbol = await cbc.symbol.call()
    assert.equal(symbol.valueOf(), 'CBC', 'Contract does not have the correct symbol')
  })

  it('should initialize the contract with the name CashBetCoin', async () => {
    const symbol = await cbc.name.call()
    assert.equal(symbol.valueOf(), 'CashBetCoin', 'Contract does not have the correct name')
  })

  it('should fail because function does not exist in contract', async () => {
    try {
      await cbc.nonExistentFunction()
    } catch (ex) {
      expect(ex.name).to.equal('TypeError')
      return true
    }
    throw new Error("I should never see this!")
  })
    
  it('owner should own all the supply of tokens', async () => {
    owner = accounts[0]
    ownerBalance = (await cbc.balanceOf(owner)).toNumber()
    assert.equal(ownerBalance, new BigNumber(TOTAL_SUPPLY), 'Owner does not own all the tokens')
  })

  it('second account should not own any tokens', async () => {
    account_two = accounts[1]
    balance_two = (await cbc.balanceOf(account_two)).toNumber()
    assert.equal(balance_two, 0, 'Second account somehow has tokens')
  })
    
  it('should correctly transfer cbc tokens', async () => {
    account_one = accounts[0]
    account_two = accounts[1]
    amount = 10

    balance1 = await cbc.balanceOf.call(account_one)
    balance2 = await cbc.balanceOf.call(account_two)

    account_one_starting_balance = balance1.toNumber()
    account_two_starting_balance = balance2.toNumber()

    rv = await cbc.transfer(account_two, amount, {from: account_one})
      
    evt = rv.logs[0]
    expect(evt.event).to.equal("Transfer")
    expect(evt.args.from).to.equal(account_one)
    expect(evt.args.to).to.equal(account_two)
    expect(evt.args.value.c[0]).to.equal(10)
      
    balance3 = await cbc.balanceOf.call(account_one)
    balance4 = await cbc.balanceOf.call(account_two)

    account_one_ending_balance = balance3.toNumber()
    account_two_ending_balance = balance4.toNumber()

    assert.equal(account_one_ending_balance, account_one_starting_balance - 10, "Amount wasn't correctly taken from the sender")
    assert.equal(account_two_ending_balance, account_two_starting_balance + 10, "Amount wasn't correctly sent to the reciever")
  })


  it('should not allow a non-owner to transfer ownership', async () => {
    account_two = accounts[1]
    await utils.assertRevert(cbc.setOwner(account_two, {from: account_two}))
  })

  it('should allow you to burn tokens', async () => {
    account_two = accounts[1]
    amount = 10

    balance1 = await cbc.balanceOf.call(account_two)
    account_two_starting_balance = balance1.toNumber()

    await cbc.burnTokens(amount, {from: account_two})

    balance2 = await cbc.balanceOf.call(account_two)

    account_two_ending_balance = balance2.toNumber()
    assert.equal(balance2, balance1 - 10, 'Tokens were not properly burned')
  })

  it('should not allow you to burn tokens you don\'t have', async () => {
    account_two = accounts[1]
    amount = 200
    await utils.assertRevert(cbc.burnTokens(amount, {from: account_two}))
  })

  it('should not be possible to transfer more tokens than than you have', async () => {
    account_two = accounts[1]
    account_three = accounts[2]
    amount = 200

    await utils.assertRevert(cbc.transfer(account_three, amount, {from: account_two}))
  })

  it('should not allow non-owner to set employee', async () => {
    account_two = accounts[1]
    account_three = accounts[2]
      await utils.assertRevert(cbc.setEmployee(account_two, web3.fromAscii('CashBet', 32), true, {from: account_three}))
  })

})
