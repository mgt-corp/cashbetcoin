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

  it('should initialize the contract with the message sender as owner', async () => {
    const owner = await cbc.owner.call()
    assert.equal(onwer.valueOf(), accounts[0], 'Account does not have the correct owner after init')
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
    } catch (e) {
      return true
    }
    throw new Error("I should never see this!")
  })

  it('should correctly transfer cbc tokens', async () => {
    account_one = accounts[0]
    account_two = accounts[1]
    amount = 10

    balance1 = await cbc.balanceOf.call(account_one)
    balance2 = await cbc.balanceOf.call(account_two)

    account_one_starting_balance = balance1.toNumber()
    account_two_starting_balance = balance2.toNumber()

    await cbc.transfer(account_two, amount, {from: account_one})

    balance3 = await cbc.balanceOf.call(account_one)
    balance4 = await cbc.balanceOf.call(account_two)

    account_one_ending_balance = balance3.toNumber()
    account_two_ending_balance = balance4.toNumber()

    assert.equal(account_one_ending_balance, account_one_starting_balance - 10, "Amount wasn't correctly taken from the sender")
    assert.equal(account_two_ending_balance, account_two_starting_balance + 10, "Amount wasn't correctly sent to the reciever")
  })

})
