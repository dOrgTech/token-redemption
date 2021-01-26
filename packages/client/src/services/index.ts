import StableRedemption from "@dorgtech/dorg-token-contracts/artifacts/StableRedemption.json";
import StakingReward from "@dorgtech/dorg-token-contracts/artifacts/StakingReward.json";
import ERC20 from "@dorgtech/dorg-token-contracts/artifacts/TestERC20.json";
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Contract, Signer } from 'ethers';
import { Web3, Address, EthereumSigner } from "./web3";

const getStableRedemptionContract = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const { address } = Addresses.StableRedemption;
  const { abi } = StableRedemption;
  const instance = await web3.getContract(address, abi);
  return instance;
}

const getStakingRewardContract = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const { address } = Addresses.StakingReward;
  const { abi } = StakingReward;
  const instance = await web3.getContract(address, abi);
  return instance;
}

const getStakingRewardContractSigned = async (): Promise<any> => {
  const StakingRewardContract: Contract = await getStakingRewardContract();
  const signer: EthereumSigner = await getSigner();
  const StakingRewardSigned: Contract = StakingRewardContract.connect(signer as Signer);
  return StakingRewardSigned;
}

const getTokenBalance = async (tokenAddress: Address, account?: Address): Promise<any> => {
  const { abi } = ERC20;
  const web3 = await Web3.getInstance();
  if(!account) {
    const accounts = await web3.getAccounts();
    account = accounts[0];
  }
  const instance = await web3.getContract(tokenAddress, abi) as any;
  const balance = await instance.balanceOf(account);
  return balance;
}

const getTokenDecimals = async (tokenAddress: Address): Promise<any> => {
  const { abi } = ERC20;
  const web3 = await Web3.getInstance();
  const instance = await web3.getContract(tokenAddress, abi);
  const decimals = await instance.decimals();
  return decimals;
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

const getProviderSelectedAddress = async (): Promise<any> => {
  const web3 = await Web3.getInstance();
  const accounts = await web3.getAccounts();
  return accounts[0];
}

export {
  getStableRedemptionContract,
  getSigner,
  getProvider,
  getTokenBalance,
  getTokenDecimals,
  getProviderSelectedAddress,
  getStakingRewardContract,
  getStakingRewardContractSigned,
};
