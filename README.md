CashBet Coin
----------------------------------------------------------------

#### Deploying with Truffle

    export CBCROOT=~/cashbet/cashbetcoindev

    cd $CBCROOT
    truffle compile
    truffle migrate --network ropsten

#### Testing

Start Ganache:

    ganache

Run the unit tests:

    export CBCROOT=~/cashbet/cashbetcoindev

    cd $CBCROOT
    truffle test

Minimize the ABI JSON w/ minjson

    minjson

TODO:

Coalesce the multi-associate-player versions:
* playerid.js
* migrate.js
