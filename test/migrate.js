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
        rv = await cbc1.setEmployee(empl, true)
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
                                 utils.tokenAmtStr(3000),
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
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 3000))
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(3000))
        
        rv1 = await cbc1.balanceOf(user[2])
        expect(rv1.c[0]).to.equal(utils.tokenAmtInt(0))

        rv2 = await cbc2.balanceOf(user[2])
        expect(rv2.c[0]).to.equal(utils.tokenAmtInt(3000))
    })
    
    it('can migrate the owner', async () => {
        rv = await cbc2.optIn({from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        
        supply1 = await cbc1.totalSupply.call()
        expect(supply1.valueOf()).to.equal(utils.tokenAmtStr(8000))
        
        supply2 = await cbc2.totalSupply.call()
        expect(supply2.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 8000))
        
        rv1 = await cbc1.balanceOf(owner)
        expect(rv1.valueOf()).to.equal('0')

        rv2 = await cbc2.balanceOf(owner)
        expect(rv2.valueOf()).to.equal(utils.tokenAmtStr(430e6 - 11000))
    })
})
