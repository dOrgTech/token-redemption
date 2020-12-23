import StableRedemptionArtifact from "../artifacts/StableRedemption.json";
import DorgTokenContract from "../artifacts/DorgTokenContract.json";
import { Web3 } from "./web3";

const getStableRedemptionContract = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const instance = await web3.getContract("0x530De1B4dd8b377c6cf961645AE21c99731c3870", StableRedemptionArtifact.abi) as any;
  return instance;
}

const getDorgTokenBalance = async (): Promise<any> => {
  const tokenAddress = "0x8E11217a3E41B352174041DB83693F90BDB43941";
  const web3 = await Web3.getInstance();
  const provider = await web3.provider;
  const accounts = await provider.listAccounts();
  const instance = await web3.getContract(tokenAddress, DorgTokenContract.abi) as any;
  const balance = await instance.balanceOf(accounts[0]);
  return balance;
}

const getSigner = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const signer = web3.signer;
  return signer;
}

const getProvider = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const provider = await web3.provider;
  return provider;
}



export { getStableRedemptionContract, getSigner, getProvider, getDorgTokenBalance };
