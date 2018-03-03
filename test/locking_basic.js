const expect = require('chai').expect
const CBC = artifacts.require("CashBetCoin")
const utils = require('./utils')

const TOTAL_SUPPLY = utils.tokenAmtStr(430e6)

let deployed = null
let accounts = null
let owner = null
let empl = null
let user = null
let amt = null
let exp = null


beforeEach(async () => {
})

contract('CashBetCoin', (accounts) => {

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
        rv = await deployed.setEmployee(empl, true)
        expect(rv.receipt.status).to.equal('0x01')

        rv = await deployed.transfer(user[0],
                                         utils.tokenAmtStr(5000),
                                         {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
    })

    it('initial coins have no lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(0))
    })

    it('initial coins have no lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(0))
    })

    it('user can lock 1000 tokens for 30 days', async () => {
        amt = 1000
        exp = utils.now() + 30 * utils.daySecs

        rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('locked coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('locked coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(exp)
    })

    it('user can extend lock value by 1000 tokens', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        amt += 1000

        rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('lock extended coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('lock extended coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(exp)
    })

    it('user can extend lock time by 30 days', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        exp += 30 * utils.daySecs

        rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('lock extended coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('lock extended coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(exp)
    })

    it('can reduce lock time by 30 days', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        exp -= 30 * utils.daySecs

        rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         user[0],
                                         {from: empl})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockDecreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.employee).to.equal(empl)
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('lock reduced coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('lock reduced coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(exp)
    })

    it('empl can reduce lock value by 1000', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        amt -= 1000

        rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         user[0],
                                         {from: empl})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockDecreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.employee).to.equal(empl)
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('lock reduced coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('lock reduced coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(exp)
    })
})
