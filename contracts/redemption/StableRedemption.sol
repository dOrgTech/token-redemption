import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Redeem 1 input token for 1 redmeption token
 *
 * Holders of the input `token` are able to call the
 * `redeem(_redeemToken, _amount)` function, which will:
 *   1. transfer `_amount` of the input `token` to this contract (burning)
 *   2. transfer `_amount` of `_redeemToken` to the caller (redeeming)
 */
contract StableRedemption is Ownable {

  /// @notice Token that can be redeemed for a redemption token
  IERC20 token;

  /// @notice Whitelisted redeemable stable tokens
  mapping(IERC20 => bool) tokenList;

  event TokenListUpdated(
    address indexed token,
    bool listed
  );

  event TokenSet(address indexed token)

  function initialize(
    address _owner,
    IERC20 _token,
    IERC20[] _redemptionTokens
  ) external initializer {
    __Ownable_init();
    transferOwnership(_owner);

    _setToken(_token);

    uint len = _redemptionTokens.length;
    for (uint i = 0; i < len; i++) {
      _listToken(_redemptionTokens[i]);
    }
  }

  function setToken(IERC20 _token) public onlyOwner {
    _setToken(_token);
  }

  function listToken(IERC20 _token) public onlyOwner {
    _listToken(_token);
  }

  function unlistToken(IERC20 _token) public onlyOwner {
    _unlistToken(_token);
  }

  function transferToken(IERC20 _token, uint256 _amount, address _destination) external onlyOwner {
    _transferToken(_token, _amount, _destination);
  }

  function redeem(IERC20 _redeemToken, uint256 _amount) {
    _redeem(_redeemToken, _amount, msg.sender);
  }

  function redeemMulti(IERC20[] _redeemTokens, uint256[] _amounts) {
    require(
      _redeemTokens.length == _amounts.length,
      "Number of tokens must match the number of amounts"
    );

    uint len = _redeemTokens.length;
    for (uint i = 0; i < len; i++) {
      _redeem(_redeemTokens[i], _amounts[i], msg.sender);
    }
  }

  function _setToken(IERC20 _token) internal {
    token = _token;
    emit TokenSet(address(token));
  }

  function _listToken(IERC20 _token) internal {
    tokenList[_token] = true;
    emit TokenListUpdated(address(_token), true);
  }

  function _unlistToken(IERC20 _token) internal {
    tokenList[_token] = false;
    emit TokenListUpdated(address(_token), false);
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
      _redeemToken.balanceOf(this) >= _amount,
      "Not enough tokens available for requested redemption amount"
    );
    require(
      token.balanceOf(_redeemer) >= _amount,
      "Redeemer does not have enough tokens"
    );
    require(
      token.allowance(_redeemer, this) >= _amount,
      "Unable to spend the redeemer's tokens on their behalf"
    );

    token.transferFrom(_redeemer, this, _amount);
    _transferToken(_redeemToken, _amount, _redeemer);
  }
}
