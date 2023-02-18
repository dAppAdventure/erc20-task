// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Описание стандарта ERC20:
// https://eips.ethereum.org/EIPS/eip-20
contract MyERC20 is ERC20 {

    constructor(string memory name_, string memory symbol_, uint initialSupply_) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply_);
    }
}