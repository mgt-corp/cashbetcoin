pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * CashBetCoin ERC20 token
 * Based on the OpenZeppelin Standard Token
 * https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/ERC20/StandardToken.sol
 */

contract MigrationSource {
  function vacate(address _addr) public returns (uint256 o_balance,
                                                 uint256 o_lock_value,
                                                 uint256 o_lock_endTime,
                                                 bytes32 o_operatorId,
                                                 bytes32 o_playerId);
}

contract CashBetCoin2 is MigrationSource, ERC20 {
  using SafeMath for uint256;

  string public constant name = "CashBetCoin";
  string public constant symbol = "CBC";
  uint8 public constant decimals = 8;
  uint internal totalSupply_;

  address owner;

  mapping(bytes32 => bool) operators;
  mapping(address => User) users;
  mapping(address => bytes32) employees;

  MigrationSource migrateFrom;
  address migrateTo;

  struct User {
    uint256 balance;
    uint256 lock_value;
    uint256 lock_endTime;
    bytes32 operatorId;
    bytes32 playerId;
      
    mapping(address => uint256) authorized;
  }

  modifier only_owner(){
    require(msg.sender == owner);
    _;
  }

  event Approval(address indexed owner, address indexed spender, uint256 value);
  event Transfer(address indexed from, address indexed to, uint256 value);

  event LockIncreased(address indexed user, uint256 amount, uint256 time);
  event LockDecreased(address indexed user, address employee,  uint256 amount, uint256 time);

  event Associate(address indexed user, address agent, bytes32 indexed operatorId, bytes32 playerId);
  
  event Burn(address indexed owner, uint256 value);

  event OptIn(address indexed owner, uint256 value);
  event Vacate(address indexed owner, uint256 value);

  event Employee(address indexed empl, bytes32 operatorId);
  event Operator(bytes32 indexed operatorId, bool allowed);

  function CashBetCoin2(uint _totalSupply) public {
    totalSupply_ = _totalSupply;
    owner = msg.sender;
    User storage user = users[owner];
    user.balance = totalSupply_;
    user.lock_value = 0;
    user.lock_endTime = 0;
    user.operatorId = bytes32(0);
    user.playerId = bytes32(0);
    Transfer(0, owner, _totalSupply);
  }

  function totalSupply() public view returns (uint256){
    return totalSupply_;
  }

  function balanceOf(address _addr) public view returns (uint256 balance) {
    return users[_addr].balance;
  }

  function transfer(address _to, uint256 _value) public returns (bool success){
    User storage user = users[msg.sender];
    require(user.lock_endTime < block.timestamp ||
            _value <= user.balance - user.lock_value);
    require(_value <= user.balance);

    user.balance = user.balance.sub(_value);
    users[_to].balance = users[_to].balance.add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
    User storage user = users[_from];
    require(user.lock_endTime < block.timestamp ||
            _value <= user.balance - user.lock_value);
    require(_value <= user.balance);
    require(_value <= user.authorized[msg.sender]);

    user.balance = user.balance.sub(_value);
    users[_to].balance = users[_to].balance.add(_value);
    user.authorized[msg.sender] = user.authorized[msg.sender].sub(_value);

    Transfer(_from, _to, _value);
    return true;
  }

  function approve(address _spender, uint256 _value) public returns (bool success){
    // To change the approve amount you first have to reduce the addresses`
    //  allowance to zero by calling `approve(_spender, 0)` if it is not
    //  already 0 to mitigate the race condition described here:
    //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    require((_value == 0) || (users[msg.sender].authorized[_spender] == 0));
    users[msg.sender].authorized[_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _user, address _spender) public view returns (uint256){
    return users[_user].authorized[_spender];
  }

  // Returns the number of locked tokens at the specified address.
  //
  function lockedValueOf(address _addr) public view returns (uint256 value) {
    User storage user = users[_addr];
    // Is the lock expired?
    if (user.lock_endTime < block.timestamp) {
      // Lock is expired, no locked value.
      return 0;
    } else {
      return user.lock_value;
    }
  }

  // Returns the unix time that the current token lock will expire.
  //
  function lockedEndTimeOf(address _addr) public view returns (uint256 time) {
    return users[_addr].lock_endTime;
  }

  // Lock the specified number of tokens until the specified unix
  // time.  The locked value and expiration time are both absolute (if
  // the account already had some locked tokens the count will be
  // increased to this value.)  If the user already has locked tokens
  // the locked token count and expiration time may not be smaller
  // than the previous values.
  //
  function increaseLock(uint256 _value, uint256 _time) public returns (bool success) {
    User storage user = users[msg.sender];

    // Is there a lock in effect?
    if (block.timestamp < user.lock_endTime) {
      // Lock in effect, ensure nothing gets smaller.
      require(_value >= user.lock_value);
      require(_time >= user.lock_endTime);
      // Ensure something has increased.
      require(_value > user.lock_value || _time > user.lock_endTime);
    }

    // Things we always require.
    require(_value <= user.balance);
    require(_time > block.timestamp);

    user.lock_value = _value;
    user.lock_endTime = _time;
    LockIncreased(msg.sender, _value, _time);
    return true;
  }

  // Employees of CashBet may decrease the locked token value and/or
  // decrease the locked token expiration date.  These values may not
  // ever be increased by an employee.
  //
  function decreaseLock(uint256 _value, uint256 _time, address _user) public returns (bool success) {
    User storage user = users[_user];
    
    // Only qualified employees allowed.
    if (user.operatorId == bytes32(0)) {
      // Unassociated players may be managed by any employee.
      require(employees[msg.sender] != bytes32(0));
    } else {
      // Associated players may only be managed by operator's employees.
      require(employees[msg.sender] == user.operatorId);
    }
    
    // We don't modify expired locks (they are already 0)
    require(user.lock_endTime > block.timestamp);
    // Ensure nothing gets bigger.
    require(_value <= user.lock_value);
    require(_time <= user.lock_endTime);
    // Ensure something has decreased.
    require(_value < user.lock_value || _time < user.lock_endTime);

    user.lock_value = _value;
    user.lock_endTime = _time;
    LockDecreased(_user, msg.sender, _value, _time);
    return true;
  }

  function associate(bytes32 _opId, bytes32 _playerId) public returns (bool success) {
    User storage user = users[msg.sender];

    // Players can associate their playerId once while the token is
    // locked.  They can't change this association until the lock
    // expires ...
    require(user.lock_value == 0 ||
            user.lock_endTime < block.timestamp ||
            user.playerId == 0);

    // OperatorId argument must be empty or in the approved operators set.
    require(_opId == bytes32(0) || operators[_opId]);

    // Never allowed to set playerId to something and operatorId empty.
    require(_opId != bytes32(0) || _playerId == bytes32(0));
    
    user.operatorId = _opId;
    user.playerId = _playerId;
    Associate(msg.sender, msg.sender, _opId, _playerId);
    return true;
  }

  function associationOf(address _addr) public view returns (bytes32 opId, bytes32 playerId) {
    return (users[_addr].operatorId, users[_addr].playerId);
  }

  function setAssociation(address _user, bytes32 _opId, bytes32 _playerId) public returns (bool success) {
    User storage user = users[_user];

    // Only qualified employees allowed.
    if (user.operatorId == bytes32(0)) {
      // Unassociated players may be managed by any employee.
      require(employees[msg.sender] != bytes32(0));
    } else {
      // Associated players may only be managed by operator's employees.
      require(employees[msg.sender] == user.operatorId);
    }
    
    // Never allowed to set playerId to something and operatorId empty.
    require(_opId != bytes32(0) || _playerId == bytes32(0));
    
    user.operatorId = _opId;
    user.playerId = _playerId;
    Associate(_user, msg.sender, _opId, _playerId);
    return true;
  }
  
  function setEmployee(address _addr, bytes32 _opId) public only_owner {
    employees[_addr] = _opId;
    Employee(_addr, _opId);
  }

  function setOperator(bytes32 _opId, bool _allowed) public only_owner {
    operators[_opId] = _allowed;
    Operator(_opId, _allowed);
  }

  function setOwner(address _addr) public only_owner {
    owner = _addr;
  }

  function burnTokens(uint256 _value) public returns (bool success) {
    User storage user = users[msg.sender];
    require(user.lock_endTime < block.timestamp ||
            _value <= user.balance - user.lock_value);
    require(_value <= user.balance);

    user.balance = user.balance.sub(_value);
    totalSupply_ = totalSupply_.sub(_value);
    Burn(msg.sender, _value);
    return true;
  }

  // Sets the contract address that this contract will migrate
  // from when the optIn() interface is used.
  //
  function setMigrateFrom(address _addr) public only_owner {
    migrateFrom = MigrationSource(_addr);
  }

  // Sets the contract address that is allowed to call vacate on this
  // contract.
  //
  function setMigrateTo(address _addr) public only_owner {
    migrateTo = _addr;
  }

  // Called by a token holding address, this method migrates the
  // tokens from an older version of the contract to this version.
  // The migrated tokens are merged with any existing tokens in this
  // version of the contract, resulting in the locked token count
  // being set to the sum of locked tokens in the old and new
  // contracts and the lock expiration being set the longest lock
  // duration for this address in either contract.  The playerId is
  // transferred unless it was already set in the new contract.
  //
  // NOTE - allowances (approve) are *not* transferred.  If you gave
  // another address an allowance in the old contract you need to
  // re-approve it in the new contract.
  //
  function optIn() public returns (bool success) {
    require(migrateFrom != MigrationSource(0));
    User storage user = users[msg.sender];
    uint256 balance;
    uint256 lock_value;
    uint256 lock_endTime;
    bytes32 opId;
    bytes32 playerId;
    (balance, lock_value, lock_endTime, opId, playerId) =
        migrateFrom.vacate(msg.sender);

    OptIn(msg.sender, balance);
    
    user.balance = user.balance.add(balance);

    bool lockTimeIncreased = false;
    user.lock_value = user.lock_value.add(lock_value);
    if (user.lock_endTime < lock_endTime) {
      user.lock_endTime = lock_endTime;
      lockTimeIncreased = true;
    }
    if (lock_value > 0 || lockTimeIncreased) {
      LockIncreased(msg.sender, user.lock_value, user.lock_endTime);
    }

    if (user.operatorId == bytes32(0) && opId != bytes32(0)) {
      user.operatorId = opId;
      user.playerId = playerId;
      Associate(msg.sender, msg.sender, opId, playerId);
    }

    totalSupply_ = totalSupply_.add(balance);

    return true;
  }

  // The vacate method is called by a newer version of the CashBetCoin
  // contract to extract the token state for an address and migrate it
  // to the new contract.
  //
  function vacate(address _addr) public returns (uint256 o_balance,
                                                 uint256 o_lock_value,
                                                 uint256 o_lock_endTime,
                                                 bytes32 o_opId,
                                                 bytes32 o_playerId) {
    require(msg.sender == migrateTo);
    User storage user = users[_addr];
    require(user.balance > 0);

    o_balance = user.balance;
    o_lock_value = user.lock_value;
    o_lock_endTime = user.lock_endTime;
    o_opId = user.operatorId;
    o_playerId = user.playerId;

    totalSupply_ = totalSupply_.sub(user.balance);

    user.balance = 0;
    user.lock_value = 0;
    user.lock_endTime = 0;
    user.operatorId = bytes32(0);
    user.playerId = bytes32(0);

    Vacate(_addr, o_balance);
  }
}
