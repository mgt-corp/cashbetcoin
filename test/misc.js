// Copyright (c) 2018 CashBet Alderney Limited. All rights reserved.

const expect = require('chai').expect
const CBC = artifacts.require("CashBetCoin")
const CBC2 = artifacts.require("CashBetCoin2")
const utils = require('./utils')

const TOTAL_SUPPLY = utils.tokenAmtStr(430e6)

const NULLBYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

let cbc1 = null
let accounts = null
let owner = null
let empl = null
let user = null
let amt = null
let exp = null
let id = null

function trimNull(aa) {
    return aa.replace(/\0[\s\S]*$/g,'');
}

beforeEach(async () => {
})

contract('Miscellaneous', (accounts) => {
    it('deploy, setup accounts', async () => {

        // Deploy the contract, check supply.
        cbc1 = await CBC.deployed()
        supply = await cbc1.totalSupply.call()
        expect(supply.valueOf()).to.equal(TOTAL_SUPPLY)

        // Setup accounts.
        accounts = await utils.getAccounts()
        // console.log(accounts)
        owner = accounts[0]
        empl = accounts[1]
        user = accounts.slice(2)
        
        // empl is employee of CashBet
        rv = await cbc1.setEmployee(empl, web3.fromAscii('CashBet', 32), true)
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Employee")
        expect(evt.args.empl).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal('CashBet')
        expect(evt.args.allowed).to.equal(true)

        // empl is employee for unassociated players
        rv = await cbc1.setEmployee(empl, NULLBYTES32, true)
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Employee")
        expect(evt.args.empl).to.equal(empl)
        expect(evt.args.operatorId.valueOf()).to.equal(NULLBYTES32)
        expect(evt.args.allowed).to.equal(true)

        // Set approved operators
        rv = await cbc1.setOperator(web3.fromAscii('CashBet', 32), true,
                                    {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Operator")
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal('CashBet')
        expect(evt.args.allowed).to.equal(true)

        rv = await cbc1.setOperator(web3.fromAscii('Acme', 32), true,
                                    {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Operator")
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal('Acme')
        expect(evt.args.allowed).to.equal(true)
        
        rv = await cbc1.setOperator(web3.fromAscii('Initrode', 32), true,
                                    {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Operator")
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal('Initrode')
        expect(evt.args.allowed).to.equal(true)
        
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
        
        // 7000 -> user[6]
        rv = await cbc1.transfer(user[6],
                                 utils.tokenAmtStr(7000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        
        // Deploy the second contract.  Leave empty
        cbc2 = await CBC2.deployed()
        supply = await cbc2.totalSupply.call()
        expect(supply.valueOf()).to.equal('0')

        rv = await cbc2.setOperator(web3.fromAscii('CashBet', 32), true)
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Operator")
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal('CashBet')
        expect(evt.args.allowed).to.equal(true)
    })
    
    it('can\'t accept eth to the contract address', async () => {
        await utils.assertRevert(cbc1.sendTransaction({
            value: web3.toWei(0.5, "ether"),
            from: user[1]
        }));
    })
})
        
