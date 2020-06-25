# Token Redemption

> Smart contract for the dOrg Token redemption flow.
___
# Specs

- `DequityRedemption` contract extends from ERC20, especifically from the [implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol) created by OpenZeppelin
- In order to make this contract upgradable with new functionalities, it is [`Initializable`](https://docs.openzeppelin.com/upgrades/2.7/writing-upgradeable) and in the `initialize` method the [DAO](https://alchemy.daostack.io/dao/0x15344ecdc2c4edfcb092e284d93c20f0529fd8a6) will be set as the owner.
- In total, this contract has six (6) methods, which are:

  - `mint(uint amount)`: Create the tokens of a given user in the contract, will call the `_mint` internal method. Only callable by the DAO.
  - `setAPR(uint amount)`: Set the global interest rate. Only callable by the DAO.
  - `reclaim(uint amount)`: A way for the DAO to "reclaim" funds that are sent to token contract, which the token contract cannot use. For example, if the DAO accidentally sends 5 DAI. Only callable by the DAO.
  - `cashOut(uint amount)`: User asks for USDC (which are redeemable 1-to-1 with dOrg tokens), the DAO checks if the users has tokens using `msg.sender` variables, then it calls the `transfer` method in the USDC token contract. It will also call the internal function `_burn` in order to destroy the existing tokens requested by the user.
  - `lock(uint amount)`: Locks tokens, which begin to compound according to `globalInterestRate`
  - `unlock(uint amount)`: Returns tokens back to sender, including the amount compounded since staking; this would be useful if you want to transfer or sell your tokens.
- In order to add funds to the contract, the DAO will send USDC to the ERC20 token's contract via the [Funding and Voting Power Plugin](https://alchemy.daostack.io/dao/0x15344ecdc2c4edfcb092e284d93c20f0529fd8a6) (It will only handle USDC)

- The stack used:
  - Buidler
  - Typescript
  - Waffle
  - Ethers
___

# Build & Contribute

## Prerequisites

- nvm
- You must create a `.env` file, checkout .env-example for reference

## Deploying contracts

> `yarn build`  
> `yarn deploy:rinkeby`

## Testing
> `yarn build`  
> `yarn test`

## Run linter
> `yarn lint`


