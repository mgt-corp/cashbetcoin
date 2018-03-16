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

contract('Associate', (accounts) => {
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
        rv = await cbc1.setEmployee(empl, web3.fromAscii('CashBet', 32))
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Employee")
        expect(evt.args.empl).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal('CashBet')

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
    
    it('initial playerid is 0', async () => {
        rv = await cbc1.associationOf(user[0])
        expect(rv[0].valueOf()).to.equal(NULLBYTES32)
        expect(rv[1].valueOf()).to.equal(NULLBYTES32)
    })

    it('player can bind playerid', async () => {
        opid = 'CashBet'
        id = '4242'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })
         
    it('playerid can be viewed', async () => {
        opid = 'CashBet'
        rv = await cbc1.associationOf(user[0])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal(id)
    })

    it('player can change playerid prior while unlocked', async () => {
        opid = 'CashBet'
        id = '4343'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })
         
    it('can lock coins after association', async () => {
        amt = 1000
        exp = utils.now() + 30 * utils.daySecs
        
        rv = await cbc1.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("LockIncreased")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(amt))
        expect(evt.args.time.c[0]).to.equal(exp)
    })
         
    it('player can\'t change playerid while locked', async () => {
        opid = 'CashBet'
        id = '4444'
        await utils.assertRevert(cbc1.associate(web3.fromAscii(opid, 32),
                                                web3.fromAscii(id, 32),
                                                {from: user[0]}))
        // should still be 4343
        opid = 'CashBet'
        rv = await cbc1.associationOf(user[0])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal('4343')
    })

    it('player can\'t change operatorId while locked', async () => {
        opid = 'Acme'
        id = '4444'
        await utils.assertRevert(cbc1.associate(web3.fromAscii(opid, 32),
                                                web3.fromAscii(id, 32),
                                                {from: user[0]}))
        // should still be 4343
        opid = 'CashBet'
        rv = await cbc1.associationOf(user[0])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal('4343')
    })

    it('employee can change playerid while locked', async () => {
        opid = 'CashBet'
        id = '4444'
        rv = await cbc1.setAssociation(user[0],
                                       web3.fromAscii(opid, 32),
                                       web3.fromAscii(id, 32),
                                       {from: empl})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })
         
    it('employee can zero playerid while locked', async () => {
        opid = 'CashBet'
        id = NULLBYTES32
        rv = await cbc1.setAssociation(user[0],
                                       web3.fromAscii(opid, 32),
                                       id,
                                       {from: empl})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(evt.args.playerId).to.equal(NULLBYTES32)
    })
         
    it('player can set playerid once while locked', async () => {
        opid = 'CashBet'
        id = '4646'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })
         
    it('player can\'t change playerid again while locked', async () => {
        opid = 'CashBet'
        id = '4747'
        await utils.assertRevert(cbc1.associate(web3.fromAscii(opid, 32),
                                                web3.fromAscii(id, 32),
                                                {from: user[0]}))
        // should still be 4646
        rv = await cbc1.associationOf(user[0])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal('4646')
    })
    
    it('only employees can use setAssociation', async () => {
        opid = 'CashBet'
        id = '4747'
        await utils.assertRevert(cbc1.setAssociation(user[0],
                                                     web3.fromAscii(opid, 32),
                                                     web3.fromAscii(id, 32),
                                                     {from: user[1]}))
        // should still be 4646
        rv = await cbc1.associationOf(user[0])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal('4646')
    })
    
    it('can migrate playerId', async () => {
        opid = 'CashBet'
        
        rv = await cbc2.setMigrateFrom(cbc1.address, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        
        rv = await cbc1.setMigrateTo(cbc2.address, {from: owner})
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
        expect(evt.args.amount.c[0]).to.equal(utils.tokenAmtInt(1000))
        expect(evt.args.time.c[0]).to.equal(exp)
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[0])
        expect(evt.args.agent).to.equal(user[0])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal('4646')
        
        rv = await cbc1.associationOf(user[0])
        expect(rv[0].valueOf()).to.equal(NULLBYTES32)
        expect(rv[1].valueOf()).to.equal(NULLBYTES32)
        
        rv = await cbc2.associationOf(user[0])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal('4646')
    })

    it('migration doesn\'t overwrite playerId in new contract', async () => {
        // Set the playerid in the new contract prior to migration.
        opid = 'CashBet'
        id = '7474'
        rv = await cbc2.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[1]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[1])
        expect(evt.args.agent).to.equal(user[1])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)

        // Set the playerid differently in the old contract.
        id = '7373'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[1]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[1])
        expect(evt.args.agent).to.equal(user[1])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
        
        rv = await cbc2.optIn({from: user[1]})
        expect(rv.receipt.status).to.equal('0x01')

        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Vacate")
        expect(evt.args.owner).to.equal(user[1])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(3000))
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("OptIn")
        expect(evt.args.owner).to.equal(user[1])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(3000))
        
        rv = await cbc1.associationOf(user[1])
        expect(rv[0].valueOf()).to.equal(NULLBYTES32)
        expect(rv[1].valueOf()).to.equal(NULLBYTES32)

        // Should not overwrite the prexisting playerId.
        rv = await cbc2.associationOf(user[1])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal('7474')
    })

    it('migration doesn\'t overwrite operatorId in new contract', async () => {
        // Set the operatorId only in the new contract prior to migration.
        opid = 'CashBet'
        id = NULLBYTES32
        rv = await cbc2.associate(web3.fromAscii(opid, 32),
                                  id,
                                  {from: user[6]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[6])
        expect(evt.args.agent).to.equal(user[6])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(evt.args.playerId).to.equal(id)

        // Set the playerid in the old contract.
        id = '7373'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[6]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[6])
        expect(evt.args.agent).to.equal(user[6])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
        
        rv = await cbc2.optIn({from: user[6]})
        expect(rv.receipt.status).to.equal('0x01')

        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Vacate")
        expect(evt.args.owner).to.equal(user[6])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(7000))
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("OptIn")
        expect(evt.args.owner).to.equal(user[6])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(7000))
        
        rv = await cbc1.associationOf(user[6])
        expect(rv[0].valueOf()).to.equal(NULLBYTES32)
        expect(rv[1].valueOf()).to.equal(NULLBYTES32)

        // Should not overwrite the prexisting operatorId and playerId
        rv = await cbc2.associationOf(user[6])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(rv[1]).to.equal(NULLBYTES32)
    })

    it('player can set playerid to 0 ', async () => {
        opid = 'Acme'
        id = NULLBYTES32
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  id,
                                  {from: user[2]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[2])
        expect(evt.args.agent).to.equal(user[2])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(evt.args.playerId).to.equal(NULLBYTES32)
    })

    it('player can associate before having balance', async () => {
        rv = await cbc1.balanceOf(user[3], {from: empl})
        expect(rv.valueOf()).to.equal('0')
        
        opid = 'Initrode'
        id = 'blahblahblah'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[3]})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[3])
        expect(evt.args.agent).to.equal(user[3])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)

        rv = await cbc1.associationOf(user[3])
        expect(trimNull(web3.toAscii(rv[0]))).to.equal(opid)
        expect(trimNull(web3.toAscii(rv[1]))).to.equal(id)
    })

    it('player can add tokens after associating prior', async () => {
        // 1000 -> user[3]
        rv = await cbc1.transfer(user[3],
                                 utils.tokenAmtStr(1000),
                                 {from: owner})
        ndx = 0
        
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Transfer")
        expect(evt.args.from).to.equal(owner)
        expect(evt.args.to).to.equal(user[3])
        expect(evt.args.value.c[0]).to.equal(utils.tokenAmtInt(1000))
        
        rv = await cbc1.balanceOf(user[3])
        expect(rv.c[0]).to.equal(utils.tokenAmtInt(1000))
    })

    it('employee can setAssociation before having balance', async () => {
        rv = await cbc1.balanceOf(user[4], {from: empl})
        expect(rv.valueOf()).to.equal('0')
        
        opid = 'CashBet'
        id = '7898789'
        rv = await cbc1.setAssociation(user[4],
                                       web3.fromAscii(opid, 32),
                                       web3.fromAscii(id, 32),
                                       {from: empl})
        expect(rv.receipt.status).to.equal('0x01')
        evt = rv.logs[0]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[4])
        expect(evt.args.agent).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })

    it('player can\'t associate with unapproved operator', async () => {
        opid = 'BadBad'
        id = '4444'
        await utils.assertRevert(cbc1.associate(web3.fromAscii(opid, 32),
                                                web3.fromAscii(id, 32),
                                                {from: user[0]}))
    })
    
    it('operator can be approved', async () => {
        opid = 'BadBad'
        rv = await cbc1.setOperator(web3.fromAscii(opid, 32), true,
                                    { from: owner })
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Operator")
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(evt.args.allowed).to.equal(true)
    })
    
    it('player can associate with newly approved operator', async () => {
        opid = 'BadBad'
        id = '4444'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[4]})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[4])
        expect(evt.args.agent).to.equal(user[4])
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })

    it('operator can be unapproved', async () => {
        opid = 'BadBad'
        rv = await cbc1.setOperator(web3.fromAscii(opid, 32), false,
                                    { from: owner })
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Operator")
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(evt.args.allowed).to.equal(false)
    })
    
    it('player can\'t associate with newly unapproved operator', async () => {
        opid = 'BadBad'
        id = '4445'
        await utils.assertRevert(cbc1.associate(web3.fromAscii(opid, 32),
                                                web3.fromAscii(id, 32),
                                                {from: user[0]}))
    })

    it('employee can initially setAssociation for unapproved operator', async () => {
        opid = 'BadBad'
        id = '4446'
        rv = await cbc1.setAssociation(user[5],
                                       web3.fromAscii(opid, 32),
                                       web3.fromAscii(id, 32),
                                       {from: empl})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[5])
        expect(evt.args.agent).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })
    
    it('employee can\'t subsequently setAssociation with unapproved operator', async () => {
        opid = 'BadBad'
        id = '4447'
        await utils.assertRevert(cbc1.setAssociation(user[5],
                                                     web3.fromAscii(opid, 32),
                                                     web3.fromAscii(id, 32),
       												 {from: empl}))
    })

    it('employee can be reassigned to unapproved operator', async () => {
        rv = await cbc1.setEmployee(empl, web3.fromAscii(opid, 32))
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Employee")
        expect(evt.args.empl).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
    })

    it('now employee can subsequently setAssociation for unapproved operator', async () => {
        opid = 'BadBad'
        id = '4448'
        rv = await cbc1.setAssociation(user[5],
                                       web3.fromAscii(opid, 32),
                                       web3.fromAscii(id, 32),
                                       {from: empl})
        expect(rv.receipt.status).to.equal('0x01')
        ndx = 0
        evt = rv.logs[ndx++]
        expect(evt.event).to.equal("Associate")
        expect(evt.args.user).to.equal(user[5])
        expect(evt.args.agent).to.equal(empl)
        expect(trimNull(web3.toAscii(evt.args.operatorId))).to.equal(opid)
        expect(trimNull(web3.toAscii(evt.args.playerId))).to.equal(id)
    })
})
