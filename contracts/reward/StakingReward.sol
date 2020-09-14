pragma solidity 0.5.16;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
 * @dev Stake tokens to earn variable APR
 */
contract StakingReward is Ownable {

  using SafeMath for uint256;

  uint256 public constant APR_DECIMALS = 4;

  /// @notice One Gregorian calendar year, has 365.2425 days, or 31556952 seconds
  uint256 private constant SECONDS_IN_YEAR = 31556952;

  struct APRUpdate {
    uint256 apr;
    uint256 timestamp;
  }

  struct Stake {
    uint256 amount;
    uint256 timestamp;
  }

  /// @notice Token that can be staked for additional tokens as a reward
  ERC20Detailed public token;

  /// @notice History of APR updates
  APRUpdate[] public aprHistory;

  /// @notice Tokens staked per holder
  mapping(address => Stake) public tokenStakes;

  /// @notice Total tokens staked
  uint256 public totalStaked;

  /// @notice Unclaimed rewards per holder
  mapping(address => uint256) public unclaimedRewards;

  event TokenSet(address indexed token);
  event APRSet(uint256 apr, uint256 timestamp);
  event TokensStaked(address indexed holder, uint256 amount, uint256 timestamp);
  event TokensUnstaked(address indexed holder, uint256 amount, uint256 timestamp);
  event RewardsClaimed(address indexed holder, uint256 amount);

  function initialize(
    address _owner,
    ERC20Detailed _token,
    uint256 _apr
  ) external initializer {
    Ownable.initialize(msg.sender);
    _transferOwnership(_owner);

    _setToken(_token);

    _setAPR(_apr);
  }

  function setToken(ERC20Detailed _token) external onlyOwner {
    _setToken(_token);
  }

  function setAPR(uint256 _apr) external onlyOwner {
    _setAPR(_apr);
  }

  function transferToken(ERC20Detailed _token, uint256 _amount, address _destination) external onlyOwner {
    _transferToken(_token, _amount, _destination);
  }

  function stake(uint256 _amount) external {
    _stake(msg.sender, _amount);
  }

  function unstake(uint256 _amount) external {
    _unstake(msg.sender, _amount);
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

  function unstakeAndClaim(uint256 _amount) external {
    _unstake(msg.sender, _amount);
    _claimRewards(msg.sender, unclaimedRewards[msg.sender]);
  }

  function apr() public view returns (uint256) {
    require(aprHistory.length > 0);
    return aprHistory[aprHistory.length - 1].apr;
  }

  function rewardsAvailable() public view returns (uint256) {
    return token.balanceOf(address(this)) - totalStaked;
  }

  function tokensStaked(address _holder) public view returns (uint256) {
    return tokenStakes[_holder].amount;
  }

  function calculateRewards(address _holder) public view returns (uint256) {
    return unclaimedRewards[_holder].add(calculateStakeRewards(_holder));
  }

  function calculateStakeRewards(address _holder) public view returns (uint256) {
    Stake memory staked = tokenStakes[_holder];

    if (staked.amount == 0 && unclaimedRewards[_holder] == 0) {
      return 0;
    }

    if (staked.timestamp == block.timestamp) {
      return 0;
    }

    uint256 rewards = 0;

    uint aprStart = _findPastAPRIndex(staked.timestamp);
    uint aprEnd = aprHistory.length;

    for (uint i = aprStart; i < aprEnd; i++) {
      APRUpdate memory aprUpdate = aprHistory[i];
      uint256 fromAprTime = aprUpdate.timestamp;

      if (i == aprStart) {
        fromAprTime = staked.timestamp;
      }

      uint256 toAprTime;

      if (i + 1 >= aprEnd) {
        toAprTime = block.timestamp;
      } else {
        toAprTime = aprHistory[i + 1].timestamp;
      }

      uint256 timePeriod = toAprTime.sub(fromAprTime);
      uint256 totalTokens = staked.amount.add(unclaimedRewards[_holder]);

      // rewards = tokens * APR * (time / year)
      // - don't forget to remove the decimal places added by the APR
      //   and time period precision (16)
      rewards = rewards.add(
        totalTokens.mul(aprUpdate.apr).mul(
          timePeriod.mul(10 ** 16).div(SECONDS_IN_YEAR)
        ).div(10 ** APR_DECIMALS.add(16))
      );
    }

    return rewards;
  }

  function _setToken(ERC20Detailed _token) internal {
    token = _token;
    emit TokenSet(address(token));
  }

  function _setAPR(uint256 _apr) internal {
    aprHistory.push(APRUpdate(_apr, block.timestamp));
    emit APRSet(_apr, block.timestamp);
  }

  function _transferToken(ERC20Detailed _token, uint256 _amount, address _destination) internal {
    _token.transfer(_destination, _amount);
  }

  function _stake(address _holder, uint256 _amount) internal {
    require(_amount > 0, "Amount must be greater than 0");
    require(
      token.allowance(_holder, address(this)) >= _amount,
      "Unable to spend the redeemer's tokens on their behalf"
    );
    require(
      token.balanceOf(_holder) >= _amount,
      "Token holder does not have enough tokens"
    );

    _updateUnclaimedRewards(_holder);

    tokenStakes[_holder].amount = tokenStakes[_holder].amount.add(_amount);
    totalStaked = totalStaked.add(_amount);

    token.transferFrom(_holder, address(this), _amount);

    emit TokensStaked(_holder, _amount, block.timestamp);
  }

  function _unstake(address _holder, uint256 _amount) internal {
    require(_amount > 0, "Amount must be greater than 0");
    require(
      tokenStakes[_holder].amount >= _amount,
      "User does not have this many tokens staked"
    );

    _updateUnclaimedRewards(_holder);

    tokenStakes[_holder].amount = tokenStakes[_holder].amount.sub(_amount);
    totalStaked = totalStaked.sub(_amount);

    _transferToken(token, _amount, _holder);

    emit TokensUnstaked(_holder, _amount, block.timestamp);
  }

  function _updateUnclaimedRewards(address holder) internal {
    unclaimedRewards[holder] = unclaimedRewards[holder].add(calculateStakeRewards(holder));
    tokenStakes[holder].timestamp = block.timestamp;
  }

  function _claimRewards(address _holder, uint256 _amount) internal {
    require(
      rewardsAvailable() >= _amount,
      "Not enough rewards available for this claim"
    );
    require(
      unclaimedRewards[_holder] >= _amount,
      "Not enough unclaimed rewards for the requested amount"
    );

    unclaimedRewards[_holder] = unclaimedRewards[_holder].sub(_amount);

    _transferToken(token, _amount, _holder);

    emit RewardsClaimed(_holder, _amount);
  }

  function _findPastAPRIndex(uint256 _timestamp) internal view returns (uint) {
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
