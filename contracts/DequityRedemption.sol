// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/// @notice Interface to interact with DAI or USDC tokens
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

contract DequityRedemption is ERC20UpgradeSafe {
    using SafeMath for uint256;
    using SafeMath for uint8;

    address public owner;

    /// @notice Annual percentage rate of interest when locking tokens
    uint8 public apr = 0;

    /// @notice Struct to know how many tokens has been locked, and when they were locked
    struct LockedInformation {
        uint256 amount;
        uint256 lockSince;
    }

    /// @notice Mapping to make the relationship between user and locked funds
    mapping(address => LockedInformation) private lockedFunds;

    /// @notice An event emitted when apr is updated
    event APRUpdate(uint8 amount);

    /**
     * @notice Initialize the Token Redemption flow
     * @param _name - Token name
     * @param _symbol - Token symbol
     * @param _owner - Owner of the contract
     */
    function initialize(
        string calldata _name,
        string calldata _symbol,
        address _owner
    ) external initializer {
        __ERC20_init(_name, _symbol);
        owner = _owner;
    }

    /**
     * @notice User with tokens in the contract can lock their funds
     * @param _amount - Amount of tokens to be locked in
     */
    function lock(uint256 _amount) external {
        require(
            balanceOf(msg.sender) >= _amount,
            "Amount of tokens to lock is greater than current balance"
        );

        uint256 oldAmount = lockedFunds[msg.sender].amount;
        if (oldAmount == 0) {
            lockedFunds[msg.sender].amount = _amount;
        } else {
            lockedFunds[msg.sender].amount.add(_amount);
            // solium-disable-next-line security/no-block-members
            uint256 timeLocked = now.sub(lockedFunds[msg.sender].lockSince);
            uint256 newTokens = getGainedTokens(timeLocked);
            _mint(msg.sender, newTokens);
        }
        // solium-disable-next-line security/no-block-members
        lockedFunds[msg.sender].lockSince = now;
    }

    // function unlock() external { }

    /**
     * @notice Owner creates tokens for an account
     * @param dest - Account that will receive the tokens
     * @param amount - Quantity of tokens to be created
     */
    function mint(address dest, uint256 amount) external onlyOwner {
        _mint(dest, amount);
    }

    /**
     * @notice Modifies the annual percentage rate - Only the owner can modify it
     * @param amount - New amount to be set as APR.
     */
    function setAPR(uint8 amount) external onlyOwner {
        require(amount < 100, "APR can not be greater than 100");
        apr = amount;
        emit APRUpdate(amount);
    }

    /**
     * @notice It will interact with the USDC token in order to transfer the tokens
     * @dev User asks to get paid by the contract, burning tokens and then calling the transfer method
     * @param amount - The amount of USDC the user asks
     */
    function cashOut(uint256 amount, address tokenAddress) external {
        /// @notice Here goes a require to check that the amount asked is not locked

        // Address of IERC20 will be static pointing to USDC token
        IERC20 usdcToken = IERC20(tokenAddress);
        require(
            usdcToken.balanceOf(address(this)) < amount,
            "Not enough funds in selected token"
        );
        _burn(msg.sender, amount);
        usdcToken.transfer(msg.sender, amount);
    }

    /**
     * @notice This method only interact with ERC20 standard.
     * @dev In case the contract receives funds from an ERC20 token that it does
     *      not use. It allows to send the funds back to the owner
     * @param amount - The amount of tokens that the owner wants back
     * @param tokenAddress - The address of the ERC20 contract
     */
    function reclaim(uint256 amount, address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(msg.sender, amount);
    }

    /**
     * @notice The calculation of the gained tokens after the lock
     * @dev It applies a formula to calculate the debt based on the APR, it consists of four steps:
     *
     * 1- Converts the APR into a decimal amount by dividing it by 100
     * 2- Calculate interest per second: Takes the decimal form of the APR and
     * divide it by the number of seconds in a year, which is 31536000
     * 3- To calculate the amount of tokens generated every second by interests,
     * multiply the value from step two with the tokensLocked in the contract by the user
     * 4- Debt: Multiply the amount of tokens generated every second by
     * the time the tokens has been locked
     *
     * The equation would be the following:
     * debt = ( [ (currentAPR / 100) / 31536000 ] * tokensLocked ) * timeLocked
     *
     */
    function getGainedTokens(uint256 _lockedTime)
        private
        view
        returns (uint256)
    {
        uint256 tokensLocked = lockedFunds[msg.sender].amount;

        // 1
        uint256 decimalAPR = apr.div(100);
        // 2
        uint256 interestPerSecond = decimalAPR.div(365 days);
        // 3
        uint256 tokensPerSecond = interestPerSecond.mul(tokensLocked);
        // 4
        uint256 debt = tokensPerSecond.mul(_lockedTime);

        return debt;
    }

    /// @notice Just the owner can trigger the method
    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can call this method");
        _;
    }
}
