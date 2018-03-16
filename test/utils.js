// Copyright (c) 2018 CashBet Alderney Limited. All rights reserved.

function toEther(n) {
    return web3.toWei(n, "ether");
};

module.exports = {
    assertRevert: async promise => {
        try {
            await promise;
            assert.fail('Expected revert not received');
        } catch (error) {
            const revertFound = error.message.search('revert') >= 0;
            assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    },

    now: function () {
        // Return a unix epoch scaled timestamp.
        return Math.round(Date.now() / 1000)
    },

    daySecs: 60 * 60 * 24,

    tokenAmtStr: function (amt) {
        // Returns a scaled string representation.
        // This routine only can support 6 fractional digits.
        // Eg: utils.tokenAmtStr(430e6)
        // Eg: utils.tokenAmtStr(1000)
        var intval = Math.round(amt * 1e6)
        return intval.toString() + "00"
    },

    tokenAmtInt: function (amt) {
        // Returns a scaled number representation.
        // IMPORTANT - This function is limited to 90M
        // Eg: utils.tokenAmtInt(1000)
        return Math.round(amt * 1e8)
    },

    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },

    getAccounts: function () {
        return new Promise(function (resolve, reject) {
            web3.eth.getAccounts(function (e, accounts) {
                if (e != null) {
                    reject(e)
                } else {
                    resolve(accounts)
                }
            })
        })
    },

    timeTravel: function (time) {
        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [time], // 86400 is num seconds in day
                id: new Date().getTime()
            }, (err, result) => {
                if(err){ return reject(err) }
                return resolve(result)
            })
        })
    },

    mineBlock: function () {
        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_mine"
            }, (err, result) => {
                if(err){ return reject(err) }
                return resolve(result)
            })
        })
    },

    toEther: toEther,

    toBee: toEther,

    halfEther: toEther(0.5),
    oneEther: toEther(1),
    twoEther: toEther(2),
    threeEther: toEther(3),
    fourEther: toEther(4),
    fiveEther: toEther(5),
    sixEther: toEther(6),
    eightEther: toEther(8),
    tenEther: toEther(10),
    hundredEther: toEther(100),

    GAS_LIMIT_IN_WEI: 50000000000,
    zeroAddress: '0x0000000000000000000000000000000000000000',
}
