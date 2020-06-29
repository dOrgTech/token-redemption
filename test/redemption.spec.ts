import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import DequityRedemptionArtifact from "../artifacts/DequityRedemption.json";
import { DequityRedemption } from "../types/DequityRedemption";
import { Wallet } from "ethers";

use(solidity);

describe("Redemption", () => {
  let dequityRedemption: DequityRedemption;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    dequityRedemption = (await deployContract(
      signer as Wallet,
      DequityRedemptionArtifact
    )) as DequityRedemption;
  });

  it("Initializes - Set name, symbol and owner", async () => {
    const dOrgAddress = "0x15344EcDc2c4EDFCB092E284d93c20F0529FD8a6";
    await dequityRedemption.initialize("dOrg", "DORG", dOrgAddress);
    const owner = await dequityRedemption.functions.owner();
    expect(owner).to.eq(dOrgAddress);
  });

  it("Cash out returns zero (for now)", async () => {
    let amount = 0;
    const cashedOut = await dequityRedemption.cashOut(amount);
    expect(cashedOut).to.eq(amount);
  });
});
