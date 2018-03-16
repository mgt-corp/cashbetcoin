// Copyright (c) 2018 CashBet Alderney Limited. All rights reserved.

const expect = require('chai').expect
const CBC = artifacts.require("CashBetCoin")
const CBC2 = artifacts.require("CashBetCoin2")
const utils = require('./utils')

const TOTAL_SUPPLY = utils.tokenAmtStr(430e6)

let cbc1 = null
let cbc2 = null
let accounts = null
let owner = null
let empl = null
let user = null
let amt = null
let exp = null

beforeEach(async () => {
})

contract('Migration', (accounts) => {
    it('deploy, setup accounts', async () => {

        // Deploy the fist contract, check supply.
        cbc1 = await CBC.deployed()
        supply = await cbc1.totalSupply.call()
        expect(supply.valueOf()).to.equal(TOTAL_SUPPLY)

        // Setup accounts.
        accounts = await utils.getAccounts()
        // console.log(accounts)
        owner = accounts[0]
        empl = accounts[1]
        user = accounts.slice(2)
        rv = await cbc1.setEmployee(empl, web3.fromAscii('CashBet', 32))
        expect(rv.receipt.status).to.equal('0x01')

        // 5000 -> user[0]
        rv = await cbc1.transfer(user[0],
                                 utils.tokenAmtStr(5000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // 3000 -> user[1]
        rv = await cbc1.transfer(user[1],
                                 utils.tokenAmtStr(3000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        
        // 2000 -> user[2]
        rv = await cbc1.transfer(user[2],
                                 utils.tokenAmtStr(2000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // 1000 -> user[3]
        rv = await cbc1.transfer(user[3],
                                 utils.tokenAmtStr(1000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // 1000 -> user[4]
        rv = await cbc1.transfer(user[4],
                                 utils.tokenAmtStr(1000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Deploy the second contract.  Leave empty
        cbc2 = await CBC2.deployed()
        supply = await cbc2.totalSupply.call()
        expect(supply.valueOf()).to.equal('0')
    })
    
    it('can\'t call optIn until migrateFrom is set', async () => {
        try {
            rv = await cbc2.optIn({from: user[0]})
        } catch (ex) {
            // expect(ex.name).to.equal('StatusError')
            return true;
        }
        throw new Error("missing exception")
    })

    it('can set migrateFrom', async () => {
        rv = await cbc2.setMigrateFrom(cbc1.address, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
    })
    
    it('can\'t call optIn until migrateTo is set', async () => {
        try {
            rv = await cbc2.optIn({from: user[0]})
        } catch (ex) {
            // expect(ex.name).to.equal('StatusError')
            return true;
        }
        throw new Error("missing exception")
    })

    it('can set migrateTo', async () => {
        rv = await cbc1.setMigrateTo(cbc2.address, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
    })
    
    it('can migrate a user', async () => {
        rv = await cbc2.optIn({from: user[2]})
        expect(rv.receipt.status).to.equal('0x01')

        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Vacate")
        expect(evt.args.owner).to.equal(user[2])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(2000))
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("OptIn")
        expect(evt.args.owner).to.equal(user[2])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(2000))
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 2000))
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(2000))
        
        rv1 = await cbc1.balanceOf(user[2])
        expect(rv1.c[0]).to.equal(utils.tokenAmtInt(0))

        rv2 = await cbc2.balanceOf(user[2])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(2000))
    })
    
    it('can migrate the owner', async () => {
        rv = await cbc2.optIn({from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Vacate")
        expect(evt.args.owner).to.equal(owner)
        expect(evt.args.value.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 12000))
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("OptIn")
        expect(evt.args.owner).to.equal(owner)
        expect(evt.args.value.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 12000))
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal(utils.tokenAmtStr(10000))
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 10000))
        
        rv1 = await cbc1.balanceOf(owner)
        expect(rv1.valueOf()).to.equal('0')

        rv2 = await cbc2.balanceOf(owner)
        expect(rv2.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 12000))
    })

    it('can migrate a locked user', async () => {
        amt = 2000
        exp = utils.now() + 30 * utils.daySecs
        rv = await cbc1.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')

        rv = await cbc2.optIn({from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Vacate")
        expect(evt.args.owner).to.equal(user[0])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(5000))
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("OptIn")
        expect(evt.args.owner).to.equal(user[0])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(5000))
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(2000))
        expect(evt.args.time.c[0]).to.equal(exp)
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal(utils.tokenAmtStr(5000))
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 5000))
        
        rv1 = await cbc1.balanceOf(user[0])
        expect(rv1.c[0]).to.equal(utils.tokenAmtInt(0))

        rv2 = await cbc2.balanceOf(user[0])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(5000))
        
        rv2 = await cbc2.lockedValueOf(user[0])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(2000))
        
        rv2 = await cbc2.lockedEndTimeOf(user[0])
        expect(rv2.c[0]).to.equal(exp)
    })
    
    it('can migrate a user onto locked tokens', async () => {
        // First transfer some tokens to user1 from the owner on the
        // new contract.
        rv = await cbc2.transfer(user[1],
                                 utils.tokenAmtStr(4000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Lock some of the new contract tokens for 30 days.
        amt = 2000
        exp = utils.now() + 30 * utils.daySecs
        rv = await cbc2.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[1]})
        expect(rv.receipt.status).to.equal('0x01')
        
        rv = await cbc2.optIn({from: user[1]})
        expect(rv.receipt.status).to.equal('0x01')
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal(utils.tokenAmtStr(2000))
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 2000))
        
        rv1 = await cbc1.balanceOf(user[1])
        expect(rv1.c[0]).to.equal(utils.tokenAmtInt(0))

        rv2 = await cbc2.balanceOf(user[1])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(7000))
        
        rv2 = await cbc2.lockedValueOf(user[1])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(2000))
        
        rv2 = await cbc2.lockedEndTimeOf(user[1])
        expect(rv2.c[0]).to.equal(exp)
    })
    
    it('can migrate a user\'s locked tokens onto locked tokens', async () => {
        // First transfer some tokens to user1 from the owner on the
        // new contract.
        rv = await cbc2.transfer(user[3],
                                 utils.tokenAmtStr(8000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Lock some of the new contract tokens for 30 days.
        amt = 3000
        exp = utils.now() + 30 * utils.daySecs
        rv = await cbc2.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[3]})
        expect(rv.receipt.status).to.equal('0x01')

        // Lock the user's old contract coins for a longer period.n
        amt = 1000
        exp = utils.now() + 60 * utils.daySecs
        rv = await cbc1.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[3]})

        // Opt the user into the new contract.
        rv = await cbc2.optIn({from: user[3]})
        expect(rv.receipt.status).to.equal('0x01')
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal(utils.tokenAmtStr(1000))
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 1000))
        
        rv1 = await cbc1.balanceOf(user[3])
        expect(rv1.c[0]).to.equal(utils.tokenAmtInt(0))

        rv2 = await cbc2.balanceOf(user[3])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(9000))
        
        rv2 = await cbc2.lockedValueOf(user[3])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(4000))
        
        rv2 = await cbc2.lockedEndTimeOf(user[3])
        expect(rv2.c[0]).to.equal(exp)
    })
    
    it('cant migrate again (no balance in original contract)', async () => {
        // Opt the user again into the new contract.
        try {
            rv = await cbc2.optIn({from: user[3]})
        } catch (ex) {
            return true
        }
        assert.fail('Expected exception not received');
    })

    it('you can re-migrate any balance acquired after migration', async () => {
        // Give user[3] another 1000 tokens in the first contract.
        rv = await cbc1.transfer(user[3],
                                 utils.tokenAmtStr(1000),
                                 {from: user[4]})
        expect(rv.receipt.status).to.equal('0x01')

        // Now you should be able to migrate again.
        rv = await cbc2.optIn({from: user[3]})
        expect(rv.receipt.status).to.equal('0x01')
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal('0')
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(430e6))
        
        rv1 = await cbc1.balanceOf(user[3])
        expect(rv1.c[0]).to.equal(utils.tokenAmtInt(0))

        rv2 = await cbc2.balanceOf(user[3])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(10000))
        
        rv2 = await cbc2.lockedValueOf(user[3])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(4000))
        
        rv2 = await cbc2.lockedEndTimeOf(user[3])
        expect(rv2.c[0]).to.equal(exp)

    })
    
})
