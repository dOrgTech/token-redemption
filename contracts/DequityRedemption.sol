// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

/// @notice Interface to interact with DAI or USDC tokens
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";


contract DequityRedemption is ERC20UpgradeSafe {
    address public owner;

    /// @notice Annual percentage rate of interest when locking tokens
    uint8 public apr = 0;

    /// @notice Struct to know how many tokens has been locked, and when they were locked
    struct LockedInformation {
        uint256 amount;
        uint256 lockTime;
    }

    /// @notice Mapping to make the relationship between user and locked funds
    mapping(address => LockedInformation) public lockedFunds;

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
/*
    function lock(uint _amount) external {
        LockedInformation memory newLock = LockedInformation(_amount, now);
        lockedFunds[msg.sender] = newLock;
    }

    function unlock() external { }
*/

    /**
     * @dev Owner creates tokens for an account
     * @param dest - Account that will receive the tokens
     * @param amount - Quantity of tokens to be created
     */
    function mint(address dest, uint256 amount)
        external
        onlyOwner
    {
        _mint(dest, amount);
    }

    /**
     * @dev Modifies the annual percentage rate - Only the owner can modify it
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
    function cashOut(uint amount, address tokenAddress) external {
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
    function reclaim(uint amount, address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(msg.sender, amount);
    }

    /**
     * @notice Just the owner can trigger the method
     */
    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can call this method");
        _;
    }
}
