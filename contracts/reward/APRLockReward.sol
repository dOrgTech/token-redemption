pragma solidity ^0.6.8;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Lock token to earn variable APR
 */
contract APRLockReward is Ownable {

  uint public constant APR_DECIMALS = 4;

  /// @notice One Gregorian calendar year, has 365.2425 days, or 31556952 seconds
  uint256 private constant SECONDS_IN_YEAR = 31556952;

  struct APRUpdate {
    uint8 apr;
    uint256 timestamp;
  }

  struct Lock {
    uint256 amount;
    uint256 timestamp;
  }

  /// @notice Token that can be locked for additional tokens as a reward
  IERC20 token;

  /// @notice History of APR updates
  APRUpdate[] aprHistory;

  /// @notice Tokens locked per holder
  mapping(address => Lock) tokenLocks;

  // TODO: accomodate for overflow +=

  /// @notice Unclaimed rewards per holder
  mapping(address => uint256) unclaimedRewards;

  event TokenSet(address indexed token);
  event APRSet(uint8 apr, uint256 timestamp);
  event TokensLocked(address indexed holder, uint256 amount, uint256 timestamp);
  event TokensUnlocked(address indexed holder, uint256 amount, uint256 timestamp);
  event RewardsClaimed(address indexed holder, uint256 amount);

  function initialize(
    address _owner,
    IERC20 _token,
    uint256 _apr
  ) external initializer {
    __Ownable_init();
    transferOwnership(_owner);

    _setToken(_token);

    _setAPR(_apr);
  }

  function setToken(IERC20 _token) external onlyOwner {
    _setToken(_token);
  }

  function setAPR(uint256 _apr) external onlyOwner {
    _setAPR(_apr);
  }

  function lock(uint256 _amount) external {
    _lock(msg.sender, _amount);
  }

  function unlock(uint256 _amount) external {
    _unlock(msg.sender, _amount);
  }

  function claimRewards() external {
    _updateUnclaimedRewards(msg.sender);
    _claimRewards(msg.sender, unclaimedRewards[msg.sender]);
  }

  function claimPartialRewards(uint256 _amount) external {
    _updateUnclaimedRewards(msg.sender);
    _claimRewards(msg.sender, _amount);
  }

  function updateUnclaimedRewards(address _holder) external {
    _updateUnclaimedRewards(_holder);
  }

  function unlockAndClaim(uint256 _amount) external {
    _unlock(msg.sender, _amount);
    _claimRewards(msg.sender, unclaimedRewards[msg.sender]);
  }

  function rewardsAvailable() public view returns (uint256) {
    return token.balanceOf(this);
  }

  function tokensLocked(address _holder) public view returns (uint256) {
    return tokenLocks[_holder].amount;
  }

  function calculateRewards(address _holder) public view returns (uint256) {
    return unclaimedRewards[_holder] + calculateLockRewards(_holder);
  }

  function calculateLockRewards(address _holder) public view returns (uint256) {
    Lock memory lock = tokenLocks[_holder];

    if (lock.amount == 0) {
      return 0;
    }

    uint256 rewards = 0;

    APRUpdate[] memory aprs = getAPRs(lock.timestamp);
    uint aprsLen = aprs.length;

    for (uint i = 0; i < aprsLen; i++) {
      APRUpdate memory aprUpdate = aprs[i];
      uint256 fromAprTime = aprUpdate.timestamp;
      uint256 toAprTime;

      if (i + 1 >= aprsLen) {
        toAprTime = block.timestamp;
      } else {
        toAprTime = aprUpdate[i + 1].timestamp;
      }

      uint256 timePeriod = toAprTime - fromAprTime;
      uint256 totalTokens = lock.amount + unclaimedRewards[_holder];

      // rewards = tokens * APR * (time / year)
      // - don't forget to remove the 2 decimal places added by the APR
      rewards += (totalTokens * aprUpdate.apr * (timePeriod / SECONDS_IN_YEAR)) / (10 ** APR_DECIMALS);
    }

    return rewards;
  }

  function getAPRs(uint256 _fromTimestamp) public view returns (APRUpdate[] memory) {
    APRUpdate[] memory aprs;

    uint start = _findPastAPRIndex(_fromTimestamp);
    uint end = aprHistory.length;

    for (uint i = start; i < end; i++) {
      APRUpdate memory apr = aprs[aprs.length++];
      apr.apr = aprHistory[i].apr;
      if (i == start) {
        apr.timestamp = _fromTimestamp;
      } else {
        apr.timestamp = aprHistory[i].timestamp;
      }
    }

    return aprs;
  }

  function _setToken(IERC20 _token) internal {
    token = _token;
    emit TokenSet(address(token));
  }

  function _setAPR(uint256 _apr) internal {
    APRUpdate storage aprUpdate = aprHistory[aprHistory.length++];
    aprUpdate.apr = _apr;
    aprUpdate.timestamp = block.timestamp;
    emit APRSet(_apr, block.timestamp);
  }

  function _lock(address _holder, uint256 _amount) internal {
    require(_amount > 0, "Amount must be greater than 0");
    require(
      token.allowance(_holder, this) >= _amount,
      "Unable to spend the redeemer's tokens on their behalf"
    );
    require(
      token.balanceOf(_holder) >= _amount,
      "Token holder does not have enough tokens"
    );

    _updateUnclaimedRewards(_holder);

    tokenLocks[_holder].amount += _amount;

    token.transferFrom(_holder, this, _amount);

    emit TokensLocked(_holder, _amount, block.timestamp);
  }

  function _unlock(address _holder, uint256 _amount) internal {
    require(_amount > 0, "Amount must be greater than 0");
    require(
      tokenLocks[_holder].amount >= _amount,
      "User does not have this many tokens locked"
    );

    _updateUnclaimedRewards(_holder);

    tokenLocks[_holder].amount -= _amount;

    token.transfer(_holder, _amount);

    emit TokensUnlocked(_holder, _amount, block.timestamp);
  }

  function _updateUnclaimedRewards(address holder) internal {
    unclaimedRewards[holder] += calculateLockRewards(holder);
    tokens[holder].timestamp = block.timestamp;
  }

  function _claimRewards(address _holder, uint256 _amount) internal {
    require(
      token.balanceOf(this) >= _amount,
      "Not enough rewards available for this claim"
    );
    require(
      unclaimedRewards[_holder] >= _amount,
      "Not enough unclaimed rewards for the requested amount"
    );

    unclaimedRewards[_holder] -= _amount;

    token.transfer(_holder, _amount);

    emit RewardsClaimed(_holder, _amount);
  }

  function _findPastAPRIndex(uint _timestamp) internal view returns (uint) {
    // Use the latest checkpoint
    if (_timestamp >= aprHistory[aprHistory.length - 1].timestamp)
      return aprHistory.length - 1;

    // Use the oldest checkpoint
    if (_timestamp < aprHistory[0].timestamp || (aprHistory.length > 1 && _timestamp < aprHistory[1].timestamp))
      return 0;

    // Binary search of the value in the array
    uint min = 0;
    uint max = aprHistory.length - 1;
    while (max > min) {
      uint mid = (max + min + 1) / 2;
      if (aprHistory[mid].timestamp <= _timestamp) {
        min = mid;
      } else {
        max = mid - 1;
      }
    }
    return min;
  }
}
