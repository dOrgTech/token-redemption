import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import StableRedemptionArtifact from "../artifacts/StableRedemption.json";
import { StableRedemption } from "../types/StableRedemption";
import TestErc20Artifact from "../artifacts/TestERC20.json";
import { TestErc20 } from "../types/TestErc20";
import { Wallet, Signer } from "ethers";

class BigNumber extends ethers.utils.BigNumber { }

use(solidity);

describe("StableRedemption", async () => {
  let inputToken: TestErc20;
  let dec16Token: TestErc20;
  let dec18Token: TestErc20;
  let dec22Token: TestErc20;
  let stableRedemption: StableRedemption;
  let deployer: Signer;
  let owner: Signer;
  let holder: Signer;
  let randomAccount: Signer;

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
    [deployer, owner, holder, randomAccount] = signers;

    inputToken = await createToken(
      owner, "Input Token", "IN", 18
    );
    dec16Token = await createToken(
      owner, "16 decimals", "DEC16", 16
    );
    dec18Token = await createToken(
      owner, "18 decimals", "DEC18", 18
    );
    dec22Token = await createToken(
      owner, "22 decimals", "DEC22", 22
    );

    stableRedemption = await deployContract(
      deployer as Wallet,
      StableRedemptionArtifact
    ) as StableRedemption;

    await stableRedemption.initialize(
      await owner.getAddress(),
      inputToken.address,
      [
        dec16Token.address,
        dec18Token.address,
        dec22Token.address
      ]
    );

    stableRedemption = stableRedemption.connect(owner);
  });

  it("setInputToken", async () => {
    const newToken = await createToken(
      owner, "new", "NEW", 18
    );
    const nonOwnerSR = stableRedemption.connect(randomAccount);
    expect(nonOwnerSR.setInputToken(newToken.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await stableRedemption.setInputToken(newToken.address);
    expect(await stableRedemption.inputToken()).to.eq(newToken.address);
  });

  it("listRedeemToken & unlistRedeemToken", async () => {
    const newToken = await createToken(
      owner, "new", "NEW", 18
    );
    const nonOwnerSR = stableRedemption.connect(randomAccount);
    expect(nonOwnerSR.listRedeemToken(newToken.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await stableRedemption.listRedeemToken(newToken.address);
    expect(await stableRedemption.tokenList(newToken.address)).to.eq(true);

    expect(nonOwnerSR.unlistRedeemToken(newToken.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await stableRedemption.unlistRedeemToken(newToken.address);
    expect(await stableRedemption.tokenList(newToken.address)).to.eq(false);
  });

  it("transferToken", async () => {
    let amount = 500;

    // Give the StableRedemption contract tokens
    await dec16Token.mint(
      stableRedemption.address, amount
    );

    expect(await dec16Token.balanceOf(stableRedemption.address))
      .to.eq(new BigNumber(amount));

    // Make sure onlyOwner can transfer them out
    await expect(stableRedemption.connect(randomAccount).transferToken(
      dec16Token.address, amount, await randomAccount.getAddress()
    )).to.be.revertedWith("Ownable: caller is not the owner");

    // Transfer them out
    await stableRedemption.transferToken(
      dec16Token.address, amount, await randomAccount.getAddress()
    );

    // Validate that the StableRedemption contract does not have the tokens,
    // and that the receiving contract does.
    expect(await dec16Token.balanceOf(stableRedemption.address))
      .to.eq(new BigNumber(0));
    expect(await dec16Token.balanceOf(await randomAccount.getAddress()))
      .to.eq(new BigNumber(amount));
  });

  it("redeem", async () => {
    const user = await randomAccount.getAddress()
    const amount = new BigNumber(500);
    const ten = new BigNumber(10);
    const amount16 = amount.mul(ten.pow(16));
    const amount18 = amount.mul(ten.pow(18));
    const amount22 = amount.mul(ten.pow(22));

    // Mint 500 of each token to the redemption contract
    await dec16Token.mint(
      stableRedemption.address, amount16
    );
    await dec18Token.mint(
      stableRedemption.address, amount18
    );
    await dec22Token.mint(
      stableRedemption.address, amount22
    );

    // Give ourselves 1500 input tokens
    await inputToken.mint(
      user, amount18.mul(3)
    );

    // Redeem each one and verify we received the right amount
    const redeem = () => stableRedemption.connect(randomAccount).redeemMulti(
      [dec16Token.address, dec18Token.address, dec22Token.address],
      [amount18, amount18, amount18]
    );

    await expect(redeem()).to.be.revertedWith(
      "Unable to spend the redeemer's tokens on their behalf"
    );

    await inputToken.connect(randomAccount).approve(
      stableRedemption.address, amount18.mul(3)
    );

    await redeem();

    expect(await inputToken.balanceOf(user))
      .to.be.eq(new BigNumber(0));

    expect(await inputToken.balanceOf(stableRedemption.address))
      .to.be.eq(amount18.mul(3));

    expect(await dec16Token.balanceOf(user))
      .to.be.eq(amount16);

    expect(await dec18Token.balanceOf(user))
      .to.be.eq(amount18);

    expect(await dec22Token.balanceOf(user))
      .to.be.eq(amount22);
  });
});
