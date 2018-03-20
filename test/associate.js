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

contract('Associate2', (accounts) => {
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
        expect(evt.args.operatorId).to.equal(NULLBYTES32)
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

    it('player can associate when unlocked', async () => {
        opid = 'CashBet'
        id = '4242'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })

    it('player can change playerId when unlocked', async () => {
        opid = 'CashBet'
        id = '4243'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })

    it('player can change operatorId when unlocked', async () => {
        opid = 'Acme'
        id = '4243'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })

    it('player can set playerId to empty when unlocked', async () => {
        opid = 'Acme'
        id = ''
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })

    it('player can set operatorId and playerId to empty when unlocked', async () => {
        // First set them to something.
        opid = 'Acme'
        id = '4244'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)

        // Now both to empty
        opid = NULLBYTES32
        id = NULLBYTES32
        rv = await cbc1.associate(opid,
                                  id,
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(evt.args.operatorId).to.equal(opid)
        expect(evt.args.playerId).to.equal(id)
    })

    it('player can\'t set operatorId to empty and playerId not empty', async () => {
        // First set them to something.
        opid = 'CashBet'
        id = '4245'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)

        // Now just operatorId to empty
        opid = NULLBYTES32
        id = '4246'
        await utils.assertRevert(cbc1.associate(opid,
                                                web3.fromAscii(id, 32),
                                                {from: user[0]}))
    })

    it('employee can\'t set operatorId to empty and playerId not empty', async () => {
        opid = NULLBYTES32
        id = '4246'
        await utils.assertRevert(cbc1.setAssociation(user[1],
                                                     opid,
                                                     web3.fromAscii(id, 32),
                                                     {from: empl}))
    })
})
