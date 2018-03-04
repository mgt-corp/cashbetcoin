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

contract('Approve/TransferFrom Fix', (accounts) => {
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

    it('allowance must go to zero before taking a new value', async () => {
        rv = await deployed.approve(user[1],
                                    utils.tokenAmtStr(5000),
                                    {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')

        try {
            rv = await deployed.approve(user[1],
                                        utils.tokenAmtStr(4000),
                                        {from: user[0]})
        } catch (ex) {
            // expect(ex.name).to.equal('StatusError')
            // Sometimes returns Error instead of StatusError
            return true
        }
        throw new Error("missing exception")

        // First you change it to zero.
        rv = await deployed.approve(user[1],
                                    utils.tokenAmtStr(0),
                                    {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')

        // Then you can change it to something else
        rv = await deployed.approve(user[1],
                                    utils.tokenAmtStr(4000),
                                    {from: user[0]})
        expect(rv.receipt.status).to.equal('0x01')
    })
})
