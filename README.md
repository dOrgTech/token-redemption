# Token Redemption

- `DequityRedemption` (name based on [this](https://github.com/dOrgTech/Ecosystem/issues/42) issue) contract will extend from ERC20, we can use the [implementation from OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol)
- Also, this contract should be [`Initializable`](https://docs.openzeppelin.com/upgrades/2.7/writing-upgradeable) - This way we can upgrade it to add new functionalities, and in this initialization we set the DAO address as the owner
- It will have three public methods that ONLY the DAO (aka the owner) can call, which are going to be `mint(amount)`, `setAPR(percentage)` and `reclaim(uint)` 
- It will have another three public methods that anyone can call which are going to be `cashOut(amount)`, `unlock(amount)` and `lock(amount)`, and they will check the msg.sender to see if the signer of the tx has tokens - When the user calls `cashOut` it will call the internal method `burn`
- In order to add funds to this `DequityRedepmtion` contract, we can just send USDC to the ERC20 token's contract via the Funding and Voting Power Plugin (We will only handle USDC)


The stack to use will be:
- Buidler
- Typescript
- Waffle
- Ethers

More information [here](https://hackernoon.com/the-new-solidity-dev-stack-buidler-ethers-waffle-typescript-706830w0)
