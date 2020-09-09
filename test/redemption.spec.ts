import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import DequityRedemptionArtifact from "../artifacts/DequityRedemption.json";
import { DequityRedemption } from "../types/DequityRedemption";
import { Wallet, Signer } from "ethers";
import { Interface } from "ethers/utils";

use(solidity);

describe("Redemption", async () => {
  const ABI = JSON.stringify(DequityRedemptionArtifact.abi);
  let dequityRedemption: DequityRedemption;
  let deployer: Signer;
  let owner: Signer;
  let holder: Signer;
  let randomAccount: Signer;

  beforeEach(async () => {
    let signers: Signer[] = await ethers.getSigners();

    [deployer, owner, holder, randomAccount] = signers;

    dequityRedemption = (await deployContract(
      deployer as Wallet,
      DequityRedemptionArtifact
    )) as DequityRedemption;
    await dequityRedemption.initialize(
      "dOrg",
      "DORG",
      await owner.getAddress()
    );
    // Set the owner as the sender
    dequityRedemption = dequityRedemption.connect(owner);
  });

  it("Initializer should set name, symbol and owner", async () => {
    const newOwner = await dequityRedemption.owner();
    expect(newOwner).to.eq(await owner.getAddress());
  });

  describe("Set APR", () => {
    it("Owner signs the tx, should update the APR", async () => {
      await dequityRedemption.setAPR(10);
      expect(await dequityRedemption.apr()).to.eq(10);
    });

    it("Not owner signs the tx, it should fail", async () => {
      const notOwnerDequityRedemption = dequityRedemption.connect(deployer);
      await expect(notOwnerDequityRedemption.setAPR(2)).to.be.revertedWith(
        "Only the owner can call this method"
      );
    });

    it("New apr can not be higher than 100", async () => {
      await expect(dequityRedemption.setAPR(101)).to.be.revertedWith(
        "APR can not be greater than 100"
      );
    });
  });

  describe("Mint tokens", () => {
    it("Owner create tokens for an account, should mint", async () => {
      const holderAddress = await holder.getAddress();
      await dequityRedemption.mint(holderAddress, 50);
      const holderBalance = await dequityRedemption.balanceOf(
        holderAddress
      );
      expect(holderBalance).to.eq("50");
    });

    it("An account that is not the owner tries to mint, it should fail", async () => {
      await expect(
        dequityRedemption.connect(randomAccount).mint(
          await randomAccount.getAddress(), 200
        )
      ).to.be.revertedWith("Only the owner can call this method");
    });
  });

  describe("Cash out", () => {});
  describe("Lock funds", () => {});
});
