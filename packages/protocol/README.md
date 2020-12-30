[![Build Status](https://travis-ci.org/dOrgTech/token-redemption.svg)](https://travis-ci.org/dOrgTech/token-redemption)
# Token Redemption

> Smart contract for the dOrg Token ecosystem.

# Contracts
## Redemption
- [`StableRedemption`](./contracts/redemption/StableRedemption.sol) - Redeem 1 input token for 1 redmeption token.

## Reward
- [`StakingReward`](./contracts/reward/StakingReward.sol) - Stake tokens to earn variable APR.

# Build & Contribute

## Prerequisites

- nvm
- You must create a `.env` file, checkout .env-example for reference

## Testing
> `yarn build`  
> `yarn test`

## Deploying contracts

> `yarn build`  
> `yarn deploy:rinkeby`
