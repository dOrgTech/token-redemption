import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import StakingRewardArtifact from "../artifacts/StakingReward.json";
import { StakingReward } from "../types/StakingReward";
import TestErc20Artifact from "../artifacts/TestERC20.json";
import { TestErc20 } from "../types/TestErc20";
import { Wallet, Signer } from "ethers";
import { Console } from "console";

class BigNumber extends ethers.utils.BigNumber { }

use(solidity);

describe("StakingReward", async () => {
  let token: TestErc20;
  let stakingReward: StakingReward;
  let deployer: Signer;
  let owner: Signer;
  let staker1: Signer;
  let staker2: Signer;
  // apr = 1.2312 (123.12%)
  const apr: BigNumber = new BigNumber(12312)

  const createToken = async (owner: Signer, name: string, symbol: string, decimals: number) => {
    const instance = await deployContract(
      deployer as Wallet,
      TestErc20Artifact
    ) as TestErc20;
    const ownerAddress = await owner.getAddress();

    await instance["initialize(address,string,string,uint8)"](
      ownerAddress, name, symbol, decimals
    );

    return instance.connect(owner);
  }

  beforeEach(async () => {
    let signers: Signer[] = await ethers.getSigners();
    [deployer, owner, staker1, staker2] = signers;

    token = await createToken(
      owner, "Staking Token", "STAKE", 18
    );

    stakingReward = await deployContract(
      deployer as Wallet,
      StakingRewardArtifact
    ) as StakingReward;

    await stakingReward.initialize(
      await owner.getAddress(),
      token.address,
      apr.toString()
    );

    stakingReward = stakingReward.connect(owner);
  });

  it("transferToken", async () => {
    let amount = 500;

    // Give the StableRedemption contract tokens
    await token.mint(
      stakingReward.address, amount
    );

    expect(await token.balanceOf(stakingReward.address))
      .to.eq(new BigNumber(amount));

    // Make sure onlyOwner can transfer them out
    await expect(stakingReward.connect(staker1).transferToken(
      token.address, amount, await staker1.getAddress()
    )).to.be.revertedWith("Ownable: caller is not the owner");

    // Transfer them out
    await stakingReward.transferToken(
      token.address, amount, await staker1.getAddress()
    );

    // Validate that the StableRedemption contract does not have the tokens,
    // and that the receiving contract does.
    expect(await token.balanceOf(stakingReward.address))
      .to.eq(new BigNumber(0));
    expect(await token.balanceOf(await staker1.getAddress()))
      .to.eq(new BigNumber(amount));
  });

  it("setToken", async () => {
    expect(await stakingReward.token()).to.be.equal(token.address);
    await expect(stakingReward.connect(staker1).setToken(stakingReward.address))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await stakingReward.setToken(stakingReward.address);
    expect(await stakingReward.token()).to.be.equal(stakingReward.address);
  });

  it("setAPR", async () => {
    expect(await stakingReward.apr()).to.be.equal(apr);
    await expect(stakingReward.connect(staker1).setAPR("1231111"))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await stakingReward.setAPR("1231111");
    expect(await stakingReward.apr()).to.be.equal(new BigNumber("1231111"));
    const firstApr = await stakingReward.aprHistory(0);
    expect(firstApr.apr).to.be.equal(apr);
  });

  it("stake & unstake", async () => {
    const ten = new BigNumber(10);
    const amount1 = new BigNumber(500).mul(ten.pow(18));
    const amount2 = new BigNumber(700).mul(ten.pow(18));
    const staker1Addr = await staker1.getAddress();
    const staker2Addr = await staker2.getAddress();

    await token.mint(await staker1.getAddress(), amount1);
    await token.mint(await staker2.getAddress(), amount2);

    await expect(stakingReward.connect(staker1).stake(amount1))
      .to.be.revertedWith("Unable to spend the redeemer's tokens on their behalf");

    await token.connect(staker1).approve(stakingReward.address, amount1);
    await token.connect(staker2).approve(stakingReward.address, amount2);

    await expect(stakingReward.connect(staker1).stake(0))
      .to.be.revertedWith("Amount must be greater than 0");
    await expect(stakingReward.connect(staker1).stake(amount2))
      .to.be.revertedWith("Unable to spend the redeemer's tokens on their behalf");
    await token.connect(staker1).approve(stakingReward.address, amount2);
    await expect(stakingReward.connect(staker1).stake(amount2))
      .to.be.revertedWith("Token holder does not have enough tokens");

    await stakingReward.connect(staker1).stake(amount1);
    await stakingReward.connect(staker2).stake(amount2);

    expect(await stakingReward.tokensStaked(staker1Addr)).to.be.eq(amount1);
    expect(await stakingReward.tokensStaked(staker2Addr)).to.be.eq(amount2);
    expect(await stakingReward.totalStaked())
      .to.be.eq(amount1.add(amount2));

    expect(stakingReward.connect(staker1).unstake(0))
      .to.be.revertedWith("Amount must be greater than 0");
    expect(stakingReward.connect(staker1).unstake(amount2))
      .to.be.revertedWith("User does not have this many tokens staked");

    await stakingReward.connect(staker1).unstake(amount1);

    expect(await stakingReward.tokensStaked(staker1Addr))
      .to.be.eq(new BigNumber(0));
    expect(await stakingReward.totalStaked())
      .to.be.eq(amount2);
  });

  it("rewardsAvailable", async () => {
    const ten = new BigNumber(10);
    const amount1 = new BigNumber(500).mul(ten.pow(18));
    const amount2 = new BigNumber(700).mul(ten.pow(18));

    await token.mint(await staker1.getAddress(), amount1);
    await token.mint(await staker2.getAddress(), amount2);
    await token.connect(staker1).approve(stakingReward.address, amount1);
    await token.connect(staker2).approve(stakingReward.address, amount2);
    await stakingReward.connect(staker1).stake(amount1);
    await stakingReward.connect(staker2).stake(amount2);
    await token.mint(stakingReward.address, amount1);

    expect(await stakingReward.rewardsAvailable())
      .to.be.eq(amount1);
  });

  it("e2e", async () => {
    const errorTolerance = 1e14;
    const ten = new BigNumber(10);
    const amount1 = new BigNumber(500).mul(ten.pow(18));
    const amount2 = new BigNumber(700).mul(ten.pow(18));
    const staker1Addr = await staker1.getAddress();
    const staker2Addr = await staker2.getAddress();

    await token.mint(await staker1.getAddress(), amount1);
    await token.mint(await staker2.getAddress(), amount2);
    await token.connect(staker1).approve(stakingReward.address, amount1);
    await token.connect(staker2).approve(stakingReward.address, amount2);
    await stakingReward.connect(staker1).stake(amount1);
    await stakingReward.connect(staker2).stake(amount2);

    const verifyReward = async (staker: string, correctReward: number) => {
      const rewards = await stakingReward.unclaimedRewards(staker);
      const error = rewards.sub(new BigNumber(correctReward.toString())).abs();
      expect(error.lt(errorTolerance) && error.gt(0))
        .to.be.eq(true);
    }

    // Increase the time by 1 day
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    const rewardMultiplierA = (86400 / 31556952) * 1.231234 * 1e18;
    const staker1RewardA = 500 * rewardMultiplierA;
    const staker2RewardA = 700 * rewardMultiplierA;

    await stakingReward.updateUnclaimedRewards(staker1Addr);
    await stakingReward.updateUnclaimedRewards(staker2Addr);
    await verifyReward(staker1Addr, staker1RewardA);
    await verifyReward(staker2Addr, staker2RewardA);

    // Update the APR to 0%
    await stakingReward.setAPR(0);

    // Progress by 30 days
    await ethers.provider.send("evm_increaseTime", [86400 * 30]);
    await ethers.provider.send("evm_mine", []);

    // Make sure the rewards are the same as before
    await stakingReward.updateUnclaimedRewards(staker1Addr);
    await stakingReward.updateUnclaimedRewards(staker2Addr);
    await verifyReward(staker1Addr, staker1RewardA);
    await verifyReward(staker2Addr, staker2RewardA);

    // Update the APR to 50%
    await stakingReward.setAPR(5000);

    // Progress by 30 days
    await ethers.provider.send("evm_increaseTime", [86400 * 30]);
    await ethers.provider.send("evm_mine", []);

    const rewardMultiplierB = ((86400 * 30) / 31556952) * 0.5 * 1e18;
    const staker1RewardB = (500 + (staker1RewardA / 1e18)) * rewardMultiplierB;
    const staker2RewardB = (700 + (staker2RewardA / 1e18)) * rewardMultiplierB;

    // Make sure the rewards are correct
    await stakingReward.updateUnclaimedRewards(staker1Addr);
    await stakingReward.updateUnclaimedRewards(staker2Addr);
    await verifyReward(staker1Addr, staker1RewardA + staker1RewardB);
    await verifyReward(staker2Addr, staker2RewardA + staker2RewardB);

    // Unstake staker2's tokens
    await stakingReward.connect(staker2).unstake(amount2);

    // Progress by 30 days
    await ethers.provider.send("evm_increaseTime", [86400 * 30]);
    await ethers.provider.send("evm_mine", []);

    const rewardMultiplierC = ((86400 * 30) / 31556952) * 0.5 * 1e18;
    const staker1RewardC = (500 + ((staker1RewardA + staker1RewardB) / 1e18)) * rewardMultiplierC;
    const staker2RewardC = ((staker2RewardA + staker2RewardB) / 1e18) * rewardMultiplierC;

    // Make sure the rewards are correct
    await stakingReward.updateUnclaimedRewards(staker1Addr);
    await stakingReward.updateUnclaimedRewards(staker2Addr);
    await verifyReward(staker1Addr, staker1RewardA + staker1RewardB + staker1RewardC);
    await verifyReward(staker2Addr, staker2RewardA + staker2RewardB + staker2RewardC);

    await token.mint(stakingReward.address, amount2.toString());

    // Claim the rewards
    await stakingReward.connect(staker1).claimRewards();

    {
      const balance = await token.balanceOf(staker1Addr);
      const error = balance.sub((staker1RewardA + staker1RewardB + staker1RewardC).toString()).abs();
      expect(error.lt(errorTolerance) && error.gt(0))
        .to.be.eq(true);
    }

    // Claim the partial reward
    await stakingReward.connect(staker2).claimPartialRewards(staker2RewardA.toString());

    {
      const balance = await token.balanceOf(staker2Addr);
      const error = balance.sub(amount2.add(staker2RewardA.toString())).abs();
      expect(error.lt(errorTolerance))
        .to.be.eq(true);
    }

    await stakingReward.connect(staker2).claimRewards();

    {
      const balance = await token.balanceOf(staker2Addr);
      const error = balance.sub(amount2.add((staker2RewardA + staker2RewardB + staker2RewardC).toString())).abs();
      expect(error.lt(errorTolerance))
        .to.be.eq(true);
    }

    await expect(stakingReward.connect(staker2).claimPartialRewards(staker2RewardA.toString()))
      .to.be.revertedWith("Not enough unclaimed rewards for the requested amount");
  });
});
