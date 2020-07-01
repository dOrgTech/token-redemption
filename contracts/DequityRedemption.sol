// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

contract DequityRedemption is ERC20UpgradeSafe {

    event APRUpdate(uint8 amount);

    address public owner;
    // Annual percentage rate of interest when locking tokens
    uint8 public APR = 0;

    /*
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
     * @dev Owner creates tokens for an account
     * @param dest - Account that will receive the tokens
     * @param amount - Quantity of tokens to be created
     */
    function mint(address dest, uint256 amount)
        external
        onlyOwner
        returns (bool)
    {
        _mint(dest, amount);
        return true;
    }


    /*
    * @dev Modifies the annual percentage rate - Only the owner can modify it
    * @params amount - New amount to be set as APR.
    */
    function setAPR(uint8 amount) external onlyOwner {
        require(amount < 100, "APR can not be greater than 99");
        APR = amount;
        emit APRUpdate(amount);
    }

    /*
     * @dev Just the owner can trigger the method
     */
    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can call this method");
        _;
    }
}
