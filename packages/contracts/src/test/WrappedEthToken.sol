// SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IERC20Token.sol";

contract WrappedEthToken is ERC20, IERC20Token {

    // solhint-disable-next-line no-empty-blocks
    constructor() ERC20("Wrapped Eth", "wEth") {
    }

    function deposit() public override payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint amount) public override {
        _burn(msg.sender, amount);
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = msg.sender.call{value:amount}("");
        require(success, "transfer failed");
    }
}
