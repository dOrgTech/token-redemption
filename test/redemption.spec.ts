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
  });

  it("Initializer should set name, symbol and owner", async () => {
    const newOwner = await dequityRedemption.functions.owner();
    expect(newOwner).to.eq(await owner.getAddress());
  });

  describe("Set APR", () => {
    it("Owner signs the tx, should update the APR", async () => {
      const data = new Interface(ABI).functions.setAPR.encode([10]);
      await owner.sendTransaction({
        to: dequityRedemption.address,
        data,
      });
      const currentAPR = await dequityRedemption.functions.apr();
      expect(currentAPR).to.eq(10);
    });

    it("Not owner signs the tx, it should fail", async () => {
      await expect(dequityRedemption.setAPR(2)).to.be.revertedWith(
        "Only the owner can call this method"
      );
    });

    it("New apr can not be higher than 100", async () => {
      const update = async () => await dequityRedemption.connect(owner).setAPR(101);
      await expect(update()).to.be.revertedWith(
        "APR can not be greater than 100"
      );
    });
  });

  describe("Mint tokens", () => {
    it("Owner create tokens for an account, should mint", async () => {
      const holderAddress = await holder.getAddress();
      const data = new Interface(ABI).functions.mint.encode([
        holderAddress,
        50,
      ]);
      await owner.sendTransaction({
        to: dequityRedemption.address,
        data,
      });
      const holderBalance = await dequityRedemption.functions.balanceOf(
        holderAddress
      );
      expect(holderBalance).to.eq("50");
    });

    it("An account that is not the owner tries to mint, it should fail", async () => {
      const randomAddress = await randomAccount.getAddress();
      await expect(
        dequityRedemption.mint(randomAddress, 200)
      ).to.be.revertedWith("Only the owner can call this method");
    });
  });

  describe("Cash out", () => {});
  describe("Lock funds", () => {});
});
