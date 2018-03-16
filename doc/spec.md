CashBetCoin Contract Specification
================================================================

1 Overview
----------------------------------------------------------------

1.1 The CashBetCoin contract creates a CashBetCoin ERC20 token (CBC).

1.2 All ERC20 semantics must be honored with a time-locking
modification.  The transfer and transferFrom methods will fail if the
needed balance is "locked".


2 Limitations
----------------------------------------------------------------

2.1 If a user wishes to establish associations with multiple operators
they must use a separate ethereum address for each operator.  Each
address can only have a single operator/playerid association.


3 Locking
----------------------------------------------------------------

3.1 A player may lock a portion of her account balance using the
increaseLock function.  The lock consists of a value (amount of tokens
locked) and an expiration time (unix timestamp).

3.2 The locked portion of the account balance may not be transfered or
subject to transferFrom until the lock expires.

3.3 A lock value of zero is effectively unlocked for all purposes.

3.4 When the current time (timestamp of the current block) exceeds the
lock end time the lock is expired and the account is considered
unlocked.

3.5 Players may increase the lock value or extend the lock end time at
any time using the increaseLock function.

3.6 Players may optionally increase only one of value and end time,
leaving the other unchanged.

3.7 Players may not decrease the lock value or shorten the lock end
time.

3.8 Employees may decrease the lock value and/or shorten the lock end
time for accounts bound to their operatorid using the decreaseLock
function.

3.9 Employees may decrease the lock value and/or shorten the lock end
time for unbound accounts (empty operatorId) using decreaseLock
function.

3.10 The values for lock value and lock end time for increaseLock and
decreaseLock are absolute, they are not delta values.  Calls to
increaseLock and decreaseLock are idempotent, extra calls with the
same arguments will fail because they don't change either value.


4 Associations
----------------------------------------------------------------

4.1 Players may associate an address with a operator specific playerId
using the associate function.

4.2 The operatorId specified in the associate function must be in
the approved operator set.

4.3 OperatorId and PlayerId are 32 byte quantities.

4.4 The interpretation of the playerId is operator specific.

4.5 The value 0 is reserved to mean empty (no id) for both operatorId
and playerId.

4.6 When an address has any locked balance a player can only add
associations; existing associations cannot be changed.

4.7 If a locked address has empty (0) operatorId and empty playerId
both may be set by the player using the associate() function.

4.8 If a locked address has an operatorId set and an empty playerId
the player may change only the playerId with the associate()
function.

4.9 If an address has no current lock the player may change both the
operatorId and playerId with the associate() function.

4.10 Employees of an operator may change the associations of addresses
which are associated with the same operator using the setAssociation
function.

4.11 If an employee of an operator sets the playerId of a locked
association to 0 with setAssociation the player may change it to a
different playerId with associate.

4.12 If an employee of an operator sets the operatorId *and* the
playerId of a locked association to 0 the player is "released" and may
change both with associate (to a different operatorId).

4.13 If the operatorId of an association is empty the playerId must be
empty too.

4.14 Locks and associations for a player address may be established in
any order.  A player can lock some CBC tokens and then associate a
playerid with an operator afterwards.  A playerid / operator
association can be established for an address before it has
established a lock.

4.15 Associations can be stored for an address without any CBC token
balance.

4.16 Employees may alter associations to operators that are not in the
operators set.

4.17 When an operator is removed from the operators set players can
not add new associations, but prior associations remain and employees
of the removed operator can still operate on associations with the
removed operator.

5 Migration
----------------------------------------------------------------

5.1 Players may optionally migrate their CBC tokens from an existing
contract to a new version of the CBC contract by using the optIn
function.

The optIn function will transfer the players tokens, locks and
associations to the new contract and remove the state in the old
contract.

5.2 You must have a non-zero token balance in the old contract to
optIn in the new contract.

5.3 Tokens, locks and associations are "merged" into any existing
state in the new contract.  Specifically:

5.3.1 The token balance in the old contract is added to any
pre-existing token balance in the new contract.  The old contract's
token balance is then set to 0.

5.3.2 The locked value from the old contract is added to the locked
value in the new contract.  The old contract's lock value is then set
to 0.

5.3.3 The lock end time from the old contract is compared to the lock
end time in the new contract and the largest value is used.  The lock
end time is set to 0 in the old contract.

5.3.4 Any operator association in the old contract is transferred, but
does not overwrite a pre-existing association in the new contract.

5.3.4.1 If the operatorId in the new contract is empty the operatorId
and playerId they are set to the operatorId and playerId from the old
contract.

5.3.4.2 If the operatorId in the new contract is not empty they are
left alone.

5.3.4.3 The operatorId and playerId in the old contract are both set
to 0 (empty).

5.4 If additional tokens are transferred to the old contract address
after a player has migrated, the optIn function may be called again to
transfer the additional tokens to the new contract.

5.5 The owner must use the setMigrateFrom function on the new contract
to refer to the contract address of the old contract.

5.6 The owner must use the setMigrateTo function on the old contract
to refer to the the contract address of the new contract.

6 Owner Interface
----------------------------------------------------------------

6.1 The owner may use the setOperator function to add and remove
approved operators.

6.2 The owner may use the setEmployee function to add and remove
employees.

6.3 The setEmployee function specifies an operatorId for each
employee.  Employees may alter accounts which are associated with
their operator.

6.4 The owner may use the setMigrateFrom function to specify the
address of the pre-existing contract that users may optIn from.

6.5 The owner may use the setMigrateTo function to specify the address
of a new contract that users may migrate to (by using optIn on the new
contract).

6.6 The owner may use the setOwner function to assign ownership to a
different address.


7 Employee Interface
----------------------------------------------------------------

7.1 Employees of an operator may use the decreaseLock function to
decrease the locked value or shorten the expiration time of a lock
associated with that operator.

7.2 Employees may use the decreaseLock function on all locks which are
not associated with any operator (empty operatorId).

7.3 Employees may use the setAssociation function to change the
operatorId and playerId of any association which matches their
operatorId.

7.4 Employees may only set the operatorId to match their own
operatorId or empty.

7.5 If the operatorId is set to empty the playerId must be set to
empty as well.

7.6 Employees may use the setAssociation function to set the
operatorId and playerId of any association that is unbound (has an
empty operatorId).


8 Player Interface
----------------------------------------------------------------

8.1 Players may use the transfer and approve functions as specified by
ERC20.

8.2 Players may use the increaseLock function to establish or extend a
time lock on a portion of their token balance.

8.3 Players may use the associate function to bind their account
address to an operatorId and operator-specific playerId.

8.4 Players may irrevocably destroy a portion of their unlocked tokens
using the burnTokens function.  Burnt tokens are removed from the
total supply.

8.5 Players may optionaly migrate to a new version of the CBC contract
by executing the optIn function on the new contract.


9 Delegated Interface
----------------------------------------------------------------

9.1 A delegated (approveed) address may call the transferFrom function
as specified by ERC20.


10 Public Interface
----------------------------------------------------------------

10.1 The following functions are public views.  They may be called by
anyone and do not modify any state:

* lockedValueOf
* lockedEndTimeOf
* associationOf
* totalSupply
* balanceOf
* allowance


11 Events
----------------------------------------------------------------

11.1 Any function which changes state shall emit events which fully
describe the agent and the state change.

11.1.1 Any function which changes the balance of an account must emit
Transfer, Burn, OptIn or Vacate events to describe the change.

11.1.2 Any function which changes the lock value or lock end time of
an account must emit the LockIncreased and LockDecreased events to
describe the changed state of the lock.

11.1.3 Any function which changes the operatorId or playerId values of
an account must emit the Associate event to describe the changed
state.

11.1.4 Any function that changes the state of the employee set must
emit the Employee event to describe the new state.

11.1.5 Any function that changes the approved operator set must emit
the Operator event to describe the new state.
