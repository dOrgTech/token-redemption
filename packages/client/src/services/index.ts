import StableRedemption from "@dorgtech/dorg-token-contracts/artifacts/StableRedemption.json";
import ERC20 from "@dorgtech/dorg-token-contracts/artifacts/ERC20.json";
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Web3 } from "./web3";

const getStableRedemptionContract = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const { address } = Addresses.StableRedemption;
  const { abi } = StableRedemption;
  const instance = await web3.getContract(address, abi) as any;
  return instance;
}

const getDorgTokenBalance = async (): Promise<any> => {
  const { inputToken } = Addresses.StableRedemption.initializeParams;
  const tokenAddress = inputToken;
  const { abi } = ERC20;
  const web3 = await Web3.getInstance();
  const accounts = await web3.getAccounts();
  const instance = await web3.getContract(tokenAddress, abi) as any;
  const balance = await instance.balanceOf(accounts[0]);
  return balance;
}

const getSigner = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const signer = web3.getSigner();
  return signer;
}

const getProvider = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const provider = web3.getWeb3();
  return provider;
}

export { getStableRedemptionContract, getSigner, getProvider, getDorgTokenBalance };
