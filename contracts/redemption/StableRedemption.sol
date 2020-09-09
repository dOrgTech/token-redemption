pragma solidity ^0.6.8;

import "../lib/Ownable.sol";
import "../lib/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
 * @dev Redeem 1 input token for 1 redmeption token
 *
 * Holders of the input `token` are able to call the
 * `redeem(_redeemToken, _amount)` function, which will:
 *   1. transfer `_amount` of the input `token` to this contract (burning)
 *   2. transfer decimal adjusted `_amount` of `_redeemToken` to the caller (redeeming)
 */
contract StableRedemption is Ownable {

  using SafeMath for uint256;
  using SafeMath for uint8;

  /// @notice Token that can be redeemed for a redemption token
  IERC20 public inputToken;

  /// @notice Whitelisted redeemable stable tokens
  mapping(IERC20 => bool) public tokenList;

  event TokenListUpdated(
    address indexed token,
    bool listed
  );

  event InputTokenSet(address indexed inputToken);

  function initialize(
    address _owner,
    IERC20 _inputToken,
    IERC20[] calldata _redemptionTokens
  ) external initializer {
    __Ownable_init();
    transferOwnership(_owner);

    _setInputToken(_inputToken);

    uint len = _redemptionTokens.length;
    for (uint i = 0; i < len; i++) {
      _listRedeemToken(_redemptionTokens[i]);
    }
  }

  function setInputToken(IERC20 _inputToken) external onlyOwner {
    _setInputToken(_inputToken);
  }

  function listRedeemToken(IERC20 _redeemToken) external onlyOwner {
    _listRedeemToken(_redeemToken);
  }

  function unlistRedeemToken(IERC20 _redeemToken) external onlyOwner {
    _unlistRedeemToken(_redeemToken);
  }

  function transferToken(IERC20 _token, uint256 _amount, address _destination) external onlyOwner {
    _transferToken(_token, _amount, _destination);
  }

  /**
  * @notice Redeem a specified amount of tokens from the redeem token
  * @param _redeemToken - Redeem Token
  * @param _amount - Amount of "input" token (not redeem tokens)
  */
  function redeem(IERC20 _redeemToken, uint256 _amount) external {
    _redeem(_redeemToken, _amount, msg.sender);
  }

  /**
  * @notice Redeem a specified amount of tokens from the redeem token
  * @param _redeemTokens - Redeem Token
  * @param _amounts - Amount of "input" token (not redeem tokens)
  */
  function redeemMulti(IERC20[] calldata _redeemTokens, uint256[] calldata _amounts) external {
    require(
      _redeemTokens.length == _amounts.length,
      "Number of tokens must match the number of amounts"
    );

    uint len = _redeemTokens.length;
    for (uint i = 0; i < len; i++) {
      _redeem(_redeemTokens[i], _amounts[i], msg.sender);
    }
  }

  function _setInputToken(IERC20 _inputToken) internal {
    inputToken = _inputToken;
    emit InputTokenSet(address(inputToken));
  }

  function _listRedeemToken(IERC20 _redeemToken) internal {
    tokenList[_redeemToken] = true;
    emit TokenListUpdated(address(_redeemToken), true);
  }

  function _unlistRedeemToken(IERC20 _redeemToken) internal {
    tokenList[_redeemToken] = false;
    emit TokenListUpdated(address(_redeemToken), false);
  }

  function _transferToken(IERC20 _token, uint256 _amount, address _destination) internal {
    _token.transfer(_destination, _amount);
  }

  function _redeem(IERC20 _redeemToken, uint256 _amount, address _redeemer) internal {
    require(
      tokenList[_redeemToken] == true,
      "Redemption token is not whitelisted"
    );
    require(
      inputToken.balanceOf(_redeemer) >= _amount,
      "Redeemer does not have enough tokens"
    );
    require(
      inputToken.allowance(_redeemer, address(this)) >= _amount,
      "Unable to spend the redeemer's tokens on their behalf"
    );

    // Adjust the request amount of token to the redeem token's decimals
    uint256 redeemAmount = 0;

    if (_redeemToken.decimals() == inputToken.decimals()) {
      redeemAmount = _amount;
    } else if (_redeemToken.decimals() > inputToken.decimals()) {
      uint256 decimalDif = uint256(_redeemToken.decimals().sub(inputToken.decimals()));
      redeemAmount = _amount.div(10 ** decimalDif);
    } else {
      uint256 decimalDif = inputToken.decimals().sub(_redeemToken.decimals());
      redeemAmount = _amount.div(10 ** decimalDif);
    }

    require(
      _redeemToken.balanceOf(address(this)) >= redeemAmount,
      "Not enough tokens available for requested redemption amount"
    );

    inputToken.transferFrom(_redeemer, address(this), _amount);
    _transferToken(_redeemToken, redeemAmount, _redeemer);
  }
}
