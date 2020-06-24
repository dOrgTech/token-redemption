import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import DequityRedemptionArtifact from "../artifacts/DequityRedemption.json";
import { DequityRedemption } from "../types/DequityRedemption"
import { Wallet } from "ethers";

use(solidity);

describe("Redemption", () => {
  let dequityRemption: DequityRedemption;
  
  beforeEach(async () => {
    const signers = await ethers.getSigners()
    const signer = signers[0]

    dequityRemption = (await deployContract(
      signer as Wallet, 
      DequityRedemptionArtifact
    )) as DequityRedemption;
  });

  it("Cash out returns zero (for now)", async () => {
    let amount = 10
    const cashedOut = await dequityRemption.cashOut(amount);
    expect(cashedOut).to.eq(amount);
  });
});