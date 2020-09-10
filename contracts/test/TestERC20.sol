pragma solidity 0.5.16;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

contract TestERC20 is
  Initializable,
  ERC20Burnable,
  ERC20Mintable,
  ERC20Pausable,
  ERC20Detailed,
  Ownable {
  function initialize(
    address _owner,
    string calldata _name,
    string calldata _symbol,
    uint8 _decimals
  ) external initializer {
    Ownable.initialize(msg.sender);

    ERC20Detailed.initialize(_name, _symbol, _decimals);

    ERC20Mintable.initialize(address(this));
    _removeMinter(address(this));
    _addMinter(_owner);

    ERC20Pausable.initialize(address(this));
    _removePauser(address(this));
    _addPauser(_owner);

    _transferOwnership(_owner);
  }
}
