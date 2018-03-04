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

contract('Locking Semantics', (accounts) => {
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
    
    it('user can lock all but two tokens for 30 days', async () => {
        amt = 5000 - 2
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

    it('can\'t transfer locked coins', async () => {
        amt = 1000

        try {
            rv = await deployed.transfer(user[3], utils.tokenAmtStr(amt),
                                         {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('can\'t transferFrom locked coins', async () => {

        // user0 approves 1000 tokens for user1
        amt = 1000
        rv = await deployed.approve(user[1], utils.tokenAmtStr(amt),
                                    {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("Approval")
        expect(evt.args.owner).to.equal(user[0])
        expect(evt.args.spender).to.equal(user[1])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(amt))

        // user1's allowance should be 1000
        rv = await deployed.allowance(user[0], user[1],
                                      {from: user[0]})
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))

        // Shouldn't be able to transferFrom locked coins.
        try {
            rv = await deployed.transferFrom(user[0],
                                             user[3],
                                             utils.tokenAmtStr(amt),
                                             {from: user[1]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('can transfer unlocked portion', async () => {
        amt = 1
        
        rv = await deployed.transfer(user[3],
                                     utils.tokenAmtStr(amt),
                                     {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("Transfer")
        expect(evt.args.from).to.equal(user[0])
        expect(evt.args.to).to.equal(user[3])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(amt))

        rv = await deployed.balanceOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4999))
        
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4998))
        
        rv = await deployed.balanceOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(1))
        
        rv = await deployed.lockedValueOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(0))
    })

    it('can transferFrom unlocked portion', async () => {
        amt = 1
        
        rv = await deployed.transferFrom(user[0],
                                         user[3],
                                         utils.tokenAmtStr(amt),
                                         {from: user[1]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("Transfer")
        expect(evt.args.from).to.equal(user[0])
        expect(evt.args.to).to.equal(user[3])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(amt))

        rv = await deployed.balanceOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4998))
        
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4998))
        
        rv = await deployed.balanceOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(2))
        
        rv = await deployed.lockedValueOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(0))
        
        rv = await deployed.allowance(user[0], user[1])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(999))
    })

    it('can\'t transfer when unlocked depleted', async () => {
        amt = 1

        try {
            rv = await deployed.transfer(user[3], utils.tokenAmtStr(amt),
                                         {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('can\'t transferFrom when unlocked depleted', async () => {
        amt = 1

        try {
            rv = await deployed.transferFrom(user[0],
                                             user[3],
                                             utils.tokenAmtStr(amt),
                                             {from: user[1]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('employee can unlock 200 more tokens', async () => {
        rv = await deployed.lockedValueOf(user[0])
        amt = rv.c[0] / 1e8
        
        rv = await deployed.lockedEndTimeOf(user[0])
        exp = rv.c[0]

        amt -= 200
        
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

    it('now can transfer unlocked portion again', async () => {
        amt = 100
        
        rv = await deployed.transfer(user[3],
                                     utils.tokenAmtStr(amt),
                                     {from: user[0]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("Transfer")
        expect(evt.args.from).to.equal(user[0])
        expect(evt.args.to).to.equal(user[3])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(amt))

        rv = await deployed.balanceOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4898))
        
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4798))
        
        rv = await deployed.balanceOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(102))
        
        rv = await deployed.lockedValueOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(0))
    })

    it('now can transferFrom unlocked portion again', async () => {
        amt = 100
        
        rv = await deployed.transferFrom(user[0],
                                         user[3],
                                         utils.tokenAmtStr(amt),
                                         {from: user[1]})
        evt = rv.logs[0]
        expect(evt.event).to.equal("Transfer")
        expect(evt.args.from).to.equal(user[0])
        expect(evt.args.to).to.equal(user[3])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(amt))

        rv = await deployed.balanceOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4798))
        
        rv = await deployed.lockedValueOf(user[0])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(4798))
        
        rv = await deployed.balanceOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(202))
        
        rv = await deployed.lockedValueOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(0))
        
        rv = await deployed.allowance(user[0], user[1])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(899))
    })

    it('can\'t transfer when unlocked depleted again', async () => {
        amt = 1

        try {
            rv = await deployed.transfer(user[3], utils.tokenAmtStr(amt),
                                         {from: user[0]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    it('can\'t transferFrom when unlocked depleted again', async () => {
        amt = 1

        try {
            rv = await deployed.transferFrom(user[0],
                                             user[3],
                                             utils.tokenAmtStr(amt),
                                             {from: user[1]})
        } catch (ex) {
            expect(ex.name).to.equal('StatusError')
            return true
        }
        throw new Error("missing exception")
    })

    /* If you run this test ganache will be broken for further
       testing.  Uncomment and try this test once in a while.

    it('locks expire at the right time', async () => {
        amt = 1000
        delta = 30 * utils.daySecs
        exp = utils.now() + delta

        // User2 locks 1000 tokens.
        rv = await deployed.increaseLock(utils.tokenAmtStr(amt),
                                         exp,
                                         {from: user[2]})

        // Should have 1000 locked.
        rv = await deployed.lockedValueOf(user[2])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))

        rv = await utils.timeTravel(delta - 1)

        // Should still have 1000 locked.
        rv = await deployed.lockedValueOf(user[2])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(amt))

        rv = await utils.timeTravel(4)

        // Now should have 0 locked.
        rv = await deployed.lockedValueOf(user[2])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(0))
    })
    */
})
