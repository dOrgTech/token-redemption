// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <=0.6.8;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

contract DequityRedemption is ERC20UpgradeSafe {
    address public owner;

    function initialize(string memory name, string memory symbol, address _owner) public initializer {
        __ERC20_init(name, symbol);
        owner = _owner;
    }

    function cashOut(uint256 amount) public view returns (uint256) {
        console.log("the amount is", amount);
        return amount;
    }
}