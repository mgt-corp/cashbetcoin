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
                                                 uint256 o_lock_endTime);
}

contract CashBetCoin is MigrationSource, ERC20 {
  using SafeMath for uint256;

  string public constant name = "CashBetCoin";
  string public constant symbol = "CBC";
  uint8 public constant decimals = 8;
  uint internal totalSupply_;

  address owner;

  mapping(address => User) users;
  mapping(address => bool) employees;

  MigrationSource migrateFrom;
  address migrateTo;
  
  struct User {
    uint256 balance;
    uint256 lock_value;
    uint256 lock_endTime;

    mapping(address => uint256) authorized;
  }

  modifier only_employees(){
    require(employees[msg.sender]);
    _;
  }

  modifier only_owner(){
    require(msg.sender == owner);
    _;
  }

  event LockIncreased(address user, uint256 amount, uint256 time);
  event LockDecreased(address user, address employee,  uint256 amount, uint256 time);
  event Approval(address indexed owner, address indexed spender, uint256 value);
  event Transfer(address indexed from, address indexed to, uint256 value);

  event Burn(address indexed owner, uint256 value);

  event OptIn(address indexed owner, uint256 value);
  event Vacate(address indexed owner, uint256 value);
  
  function CashBetCoin(uint _totalSupply) public {
    totalSupply_ = _totalSupply;
    owner = msg.sender;
    User storage user = users[owner];
    user.balance = totalSupply_;
    user.lock_value = 0;
    user.lock_endTime = 0;
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

  function lockedEndTimeOf(address _addr) public view returns (uint256 time) {
    return users[_addr].lock_endTime;
  }

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

  function decreaseLock(uint256 _value, uint256 _time, address _user) public only_employees returns (bool success) {
    User storage user = users[_user];
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

  function setEmployee(address _addr, bool allowed) public only_owner {
    employees[_addr] = allowed;
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

  function setMigrateFrom(address _addr) public only_owner {
    migrateFrom = MigrationSource(_addr);
  }

  function setMigrateTo(address _addr) public only_owner {
    migrateTo = _addr;
  }

  function optIn() public returns (bool success) {
    require(migrateFrom != MigrationSource(0));
    User storage user = users[msg.sender];
    uint256 balance;
    uint256 lock_value;
    uint256 lock_endTime;
    (balance, lock_value, lock_endTime) = migrateFrom.vacate(msg.sender);

    user.balance = user.balance.add(balance);
    user.lock_value = user.lock_value.add(lock_value);
    if (user.lock_endTime < lock_endTime) {
      user.lock_endTime = lock_endTime;
    }
    
    totalSupply_ = totalSupply_.add(balance);
    
    OptIn(msg.sender, balance);
    return true;
  }

  function vacate(address _addr) public returns (uint256 o_balance,
                                                 uint256 o_lock_value,
                                                 uint256 o_lock_endTime) {
    require(msg.sender == migrateTo);
    User storage user = users[_addr];
    require(user.balance > 0);

    o_balance = user.balance;
    o_lock_value = user.lock_value;
    o_lock_endTime = user.lock_endTime;

    totalSupply_ = totalSupply_.sub(user.balance);
    
    user.balance = 0;
    user.lock_value = 0;
    user.lock_endTime = 0;

    Vacate(_addr, o_balance);
  }
}
