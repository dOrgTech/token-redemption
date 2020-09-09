/*
  TODO:
  - Hold dOrg tokens, used for rewarding lockers
  - Have an APR, how fast locked dOrg tokens compound
  - Lock dOrg tokens
  - Unlock dOrg tokens
  - Claim dOrg rewards
*/

pragma solidity ^0.6.8;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

contract LockReward is Ownable {

  /// @notice Token that can be locked for additional tokens as a reward
  IERC20 token;

  struct Lock {
    uint256 amount;
    uint256 timestamp;
  }

  struct APRUpdate {
    uint8 apr; // 2 decimals, 10050 == 100.50%
    uint256 timestamp;
  }

  event TokenSet(address indexed token);

  function initialize(
    address _owner,
    IERC20 _token
  ) external initializer {
    __Ownable_init();
    transferOwnership(_owner);
  }

  function setToken(IERC20 _token) public onlyOwner {
    _setToken(_token);
  }

  function _setToken(IERC20 _token) internal {
    token = _token;
    emit TokenSet(address(token));
  }
}

/*

mapping(address => Lock[]) tokenLocks;

mapping(address => uint) unclaimedRewards;

APRInfo[] aprUpdates;

lock(amount)
unlock(amount)
claimRewards()
claimPartialRewards(amount)
unlockAndClaim(amount)
setAPR(apr)

tokensLocked(user)
calculateRewards(user) // unclaimed + current tokenLocks
rewardsAvailable()
*/
