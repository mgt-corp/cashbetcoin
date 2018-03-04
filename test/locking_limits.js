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

contract('Locking Limits', (accounts) => {
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

    it('lock value greater than balance not allowed', async () => {
        amt = 5001
        exp = utils.now() + 30 * utils.daySecs

        try {
            rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('expiration in the past not allowed', async () => {
        amt = 1000
        exp = utils.now() - utils.daySecs

        try {
            rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
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

    it('lock value can\'t get smaller', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        amt -= 1
        exp += 30

        try {
            rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('exp time can\'t get earlier', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        amt += 1000
        exp -= 1

        try {
            rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('fails if called with same lock value and exp time', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        try {
            rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('can increase value by a small amount', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        // 100000000000
        amtstr = utils.tokenAmtStr(amt)
        // 100000000001
        amtstr = amtstr.substring(0, amtstr.length - 1) + '1'

        rv = await deployed.increaseLock(amtstr,
                                         exp,
                                         {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.amount.c[0]).to.equal(100000000001)
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('locked coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(100000000001)
    })

    it('locked coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(exp)
    })

    it('can increase exp time by a small amount', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        amtstr = '100000000001'
        exp += 1

        rv = await deployed.increaseLock(amtstr,
                                         exp,
                                         {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.amount.c[0]).to.equal(100000000001)
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('locked coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(100000000001)
    })

    it('locked coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[0])
        expect(rv.c[0]).to.equal(exp)
    })

    it('can lock entire balance', async () => {
        amt = 5000
        exp = utils.now() + 90 * utils.daySecs

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

    it('expired locks can\'t be decreased', async () => {
        amt = 0
        exp = utils.now()
        try {
            rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             user[1],
                                             {from: empl})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('user1 can lock 1000 tokens for 30 days', async () => {
        amt = 1000
        exp = utils.now() + 30 * utils.daySecs

        rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         {from: user[1]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[1])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('value can\'t increase on decreaseLock', async () => {
        rv = await deployed.lockedValueOf(user[1])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[1])
        exp = rv.c[0]

        amt += 1
        exp -= 10 * utils.daySecs

        try {
            rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             user[1],
                                             {from: empl})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('exp time can\'t increase on decreaseLock', async () => {
        rv = await deployed.lockedValueOf(user[1])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[1])
        exp = rv.c[0]

        amt -= 1000
        exp += 1

        try {
            rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             user[1],
                                             {from: empl})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('something needs to decrease on decreaseLock', async () => {
        rv = await deployed.lockedValueOf(user[1])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[1])
        exp = rv.c[0]

        try {
            rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                             exp,
                                             user[1],
                                             {from: empl})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('can reduce lock time by one second', async () => {
        rv = await deployed.lockedValueOf(user[1])
        amt = rv.c[0] / 1e8

        rv = await deployed.lockedEndTimeOf(user[1])
        exp = rv.c[0]

        exp -= 1

        rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         user[1],
                                         {from: empl})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockDecreased")
        expect(evt.args.user).to.equal(user[1])
        expect(evt.args.employee).to.equal(empl)
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('can reduce lock value by tiny amount', async () => {
        amtstr =  '99999999999'

        rv = await deployed.lockedEndTimeOf(user[1])
        exp = rv.c[0]

        rv = await deployed.decreaseLock(amtstr,
                                         exp,
                                         user[1],
                                         {from: empl})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockDecreased")
        expect(evt.args.user).to.equal(user[1])
        expect(evt.args.employee).to.equal(empl)
        expect(evt.args.amount.c[0]).to.equal(99999999999)
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('can reduce lock value by entire amount', async () => {
        amt = 0

        rv = await deployed.lockedEndTimeOf(user[1])
        exp = rv.c[0]

        rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         user[1],
                                         {from: empl})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockDecreased")
        expect(evt.args.user).to.equal(user[1])
        expect(evt.args.employee).to.equal(empl)
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('lock reduced coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[1])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('lock reduced coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[1])
        expect(rv.c[0]).to.equal(exp)
    })

    it('user2 can lock 2000 tokens for 30 days', async () => {
        amt = 2000
        exp = utils.now() + 30 * utils.daySecs

        rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         {from: user[2]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[2])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('can reduce lock value and time to zero', async () => {
        amt = 0
        exp = 0

        rv = await deployed.decreaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         user[2],
                                         {from: empl})
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockDecreased")
        expect(evt.args.user).to.equal(user[2])
        expect(evt.args.employee).to.equal(empl)
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })

    it('lock reduced coins have correct lockedValueOf', async () => {
        rv = await deployed.lockedValueOf(user[2])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))
    })

    it('lock reduced coins have correct lockedEndTimeOf', async () => {
        rv = await deployed.lockedEndTimeOf(user[2])
        expect(rv.c[0]).to.equal(exp)
    })

})
