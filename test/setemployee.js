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

contract('Set Employee', (accounts) => {
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

        /*
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
        */

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
        
        amt = 1000
        exp = utils.now() + 30 * utils.daySecs

        // 5000 -> user[0], unassociated, locked 1000
        rv = await cbc1.transfer(user[0],
                                 utils.tokenAmtStr(5000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        rv = await cbc1.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')

        // 3000 -> user[1], CashBet, locked 1000
        rv = await cbc1.transfer(user[1],
                                 utils.tokenAmtStr(3000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        opid = 'CashBet'
        id = '4242'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[1]})
        expect(rv.receipt.status).to.equal('0x01')
        rv = await cbc1.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[1]})
        expect(rv.receipt.status).to.equal('0x01')

        // 2000 -> user[2], Acme, locked 1000
        rv = await cbc1.transfer(user[2],
                                 utils.tokenAmtStr(2000),
                                 {from: owner})
        expect(rv.receipt.status).to.equal('0x01')
        rv = await cbc1.increaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     {from: user[2]})
        expect(rv.receipt.status).to.equal('0x01')
        opid = 'Acme'
        id = 'xxxyyyy'
        rv = await cbc1.associate(web3.fromAscii(opid, 32),
                                  web3.fromAscii(id, 32),
                                  {from: user[2]})
        expect(rv.receipt.status).to.equal('0x01')
    })
    
    it('before set empl can\'t decreaseLock anywhere', async () => {
        amt = 900
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[0],
                                                   {from: empl}))
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[1],
                                                   {from: empl}))
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[2],
                                                   {from: empl}))
    })

    it('after setEmployee for unassociated can modify unassociated', async () => {
        amt = 900

        rv = await cbc1.setEmployee(empl, NULLBYTES32, true, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Now can do the unassociated player.
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[0],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')

        // But not CashBet or Acme ...
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[1],
                                                   {from: empl}))
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[2],
                                                   {from: empl}))
    })

    it('after setEmployee for CashBet can modify two', async () => {
        amt = 800

        rv = await cbc1.setEmployee(empl, web3.fromAscii('CashBet', 32), true, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Now can do the unassociated player.
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[0],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')

        // And CashBet ...
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[1],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')

        // But not Acme
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[2],
                                                   {from: empl}))
    })

    it('after setEmployee for Acme can modify three', async () => {
        amt = 700

        rv = await cbc1.setEmployee(empl, web3.fromAscii('Acme', 32), true, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Now can do the unassociated player.
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[0],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')

        // And CashBet ...
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[1],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')

        // And Acme
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[2],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')
    })

    it('remove unassigned employee privilege', async () => {
        amt = 600

        rv = await cbc1.setEmployee(empl, NULLBYTES32, false, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Now unassociated player fails.
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[0],
                                                   {from: empl}))

        // But not CashBet
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[1],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')

        // or Acme
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[2],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')
    })

    it('remove Acme employee privilege', async () => {
        amt = 500

        rv = await cbc1.setEmployee(empl, web3.fromAscii('Acme', 32), false, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')


        // Now unassociated player fails.
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[0],
                                                   {from: empl}))

        // But not CashBet
        rv = await cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                     exp,
                                     user[1],
                                     {from: empl})
        expect(rv.receipt.status).to.equal('0x01')

        // Acme fails too
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[2],
                                                   {from: empl}))
    })

    it('remove CashBet employee privilege', async () => {
        amt = 400

        rv = await cbc1.setEmployee(empl, web3.fromAscii('CashBet', 32), false, {from: owner})
        expect(rv.receipt.status).to.equal('0x01')

        // Now unassociated player fails.
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[0],
                                                   {from: empl}))

        // and CashBet
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[1],
                                                   {from: empl}))

        // Acme fails too
        await utils.assertRevert(cbc1.decreaseLock(utils.tokenAmtStr(amt),
                                                   exp,
                                                   user[2],
                                                   {from: empl}))
    })
})
        
