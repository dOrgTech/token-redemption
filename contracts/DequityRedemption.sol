// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "@nomiclabs/buidler/console.sol";

contract DequityRedemption {

    function cashOut(uint256 amount) public view returns (uint256) {
        console.log("the amount is", amount);
        return amount;
    }
}