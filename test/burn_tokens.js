// Copyright (c) 2018 CashBet Alderney Limited. All rights reserved.

const expect = require('chai').expect
const CBC = artifacts.require("CashBetCoin")
const utils = require('./utils')

const TOTAL_SUPPLY = utils.tokenAmtStr(430e6)

const NULLBYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

let deployed = null
let accounts = null
let owner = null
let empl = null
let user = null
let amt = null
let exp = null

beforeEach(async () => {
})

contract('Burn Tokens', (accounts) => {
    it('deploy, setup accounts', async () => {

        // Deploy the contract, check supply.
        deployed = await CBC.deployed()
        supply = await deployed.totalSupply.call()
        expect(supply.valueOf()).to.equal(TOTAL_SUPPLY)

        // Setup accounts.
        accounts = await utils.getAccounts()

        // console.log(accounts)
        owner = accounts[0]
        empl = accounts[1]
        user = accounts.slice(2)
        
        // empl is employee of CashBet
        rv = await deployed.setEmployee(empl, web3.fromAscii('CashBet', 32), true)
        expect(rv.receipt.status).to.equal('0x01')

        // empl is employee for unassociated players
        rv = await deployed.setEmployee(empl, NULLBYTES32, true)
        expect(rv.receipt.status).to.equal('0x01')

        // 5000 -> user[0]
        rv = await deployed.transfer(user[0],
                                         utils.tokenAmtStr(5000),
                                         {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // 3000 -> user[1]
        rv = await deployed.transfer(user[1],
                                         utils.tokenAmtStr(3000),
                                         {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // 2000 -> user[2]
        rv = await deployed.transfer(user[2],
                                         utils.tokenAmtStr(3000),
                                         {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
    })

    it('users can\'t burn tokens they don\'t have', async () => {
        // amt = 1000
        amount = 1000
        await utils.assertRevert(deployed.burnTokens(amount, {from: user[3]}))
    })

    it('users can burn tokens', async () => {
        amt = 1000
        rv = await deployed.burnTokens(utils.tokenAmtStr(amt),
                                       {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("Burn")
        expect(evt.args.owner).to.equal(user[0])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('users balance is updated correctly', async () => {
        rv = await deployed.balanceOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4000))
    })

    it('total supply updated correctly', async () => {
        rv = await deployed.totalSupply()
        expect(rv.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 1000))
    })

    it('users can\'t burn locked tokens', async () => {
        amt = 2000 // out of 3000
        exp = utils.now() + 30 * utils.daySecs

        rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         {from: user[1]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncrease")
        expect(evt.args.user).to.equal(user[1])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)

        await utils.assertRevert(deployed.burnTokens(utils.tokenAmtStr(amt), {from: user[1]}))
    })

    it('users can burn the unlocked portion', async () => {
        amt = 1000

        rv = await deployed.burnTokens(utils.tokenAmtStr(amt),
                                       {from: user[1]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("Burn")
        expect(evt.args.owner).to.equal(user[1])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('users balance is updated correctly', async () => {
        rv = await deployed.balanceOf(user[1])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(2000))
    })

    it('total supply updated correctly', async () => {
        rv = await deployed.totalSupply()
        expect(rv.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 2000))
    })

})
