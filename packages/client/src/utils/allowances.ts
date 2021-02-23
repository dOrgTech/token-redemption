import ERC20 from "@dorgtech/dorg-token-contracts/artifacts/TestERC20.json";
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Contract, BigNumber } from "ethers";
import { Web3, Address } from "../services/web3";
import { getSigner, getProviderSelectedAddress } from "../services"
import { bigNumberifyAmount } from './'

type Allowance = {
  dorg: number,
  dorgStaking: number,
}
const MAX_ALLOWANCE: number = Number.MAX_SAFE_INTEGER;

const tokenAllowanceDORG = async (): Promise<any> => {
  const { abi } = ERC20;
  const { inputToken } = Addresses.StableRedemption.initializeParams;
  const web3 = await Web3.getInstance();
  const sRAddress: Address = Addresses.StableRedemption.address;
  const currentETHAddress: Address = await getProviderSelectedAddress();
  const dorgContract: Contract = await web3.getContract(inputToken, abi) as any;
  let currentAllowance = await dorgContract.allowance(currentETHAddress, sRAddress)
  return currentAllowance;
};

const tokenAllowanceDORGStaking = async (): Promise<any> => {
  const { abi } = ERC20;
  const { token } = Addresses.StakingReward.initializeParams;
  const web3 = await Web3.getInstance();
  const sRAddress: Address = Addresses.StakingReward.address;
  const currentETHAddress: Address = await getProviderSelectedAddress();
  const dorgContract: Contract = await web3.getContract(token, abi) as any;
  let currentAllowance = await dorgContract.allowance(currentETHAddress, sRAddress)
  return currentAllowance;
};

export const tokenHolderAllowance = async (): Promise<any> => {
  const dorg: Allowance = await tokenAllowanceDORG();
  const dorgStaking: Allowance = await tokenAllowanceDORGStaking();
  return {
    dorg: Number(dorg) / Math.pow(10, 18),
    dorgStaking: Number(dorgStaking) / Math.pow(10, 18),
  };
};

export const approveDORG = async (): Promise<any> => {
  const { abi } = ERC20;
  const sRAddress: Address = Addresses.StableRedemption.address;
  const { inputToken } = Addresses.StableRedemption.initializeParams;

  const signer = await getSigner();
  const currentETHAddress: Address = await getProviderSelectedAddress();
  const amount: BigNumber = await bigNumberifyAmount(MAX_ALLOWANCE, inputToken)
  const web3 = await Web3.getInstance();
  const dorgContract: Contract = await web3.getContract(inputToken, abi) as any;
  const dorgContractSigned: Contract = dorgContract.connect(signer);

  let currentAllowance: Allowance = await tokenHolderAllowance();
  let approve: boolean = false;
  if (currentAllowance.dorg < MAX_ALLOWANCE) {
    try {
      approve = await dorgContractSigned.approve(sRAddress, amount);
    } catch (error) {
      approve = false
    }
  } else {
    approve = true;
  }
  currentAllowance = await tokenHolderAllowance();
  return {
    currentETHAddress,
    approve,
    currentAllowance: Number(currentAllowance.dorg),
  };
};

export const approveSRDORG = async (): Promise<any> => {
  const { abi } = ERC20;
  const sRAddress: Address = Addresses.StakingReward.address;
  const { token } = Addresses.StakingReward.initializeParams;

  const signer = await getSigner();
  const currentETHAddress: Address = await getProviderSelectedAddress();
  const amount: BigNumber = await bigNumberifyAmount(MAX_ALLOWANCE, token);
  const web3 = await Web3.getInstance();
  const dorgContract: Contract = await web3.getContract(token, abi) as any;
  const dorgContractSigned: Contract = dorgContract.connect(signer);

  let currentAllowance: Allowance = await tokenHolderAllowance();
  console.log('amount', Number(amount));
  console.log('currentAllowance', currentAllowance);
  let approve: boolean = false;
  if (currentAllowance.dorgStaking < MAX_ALLOWANCE) {
    try {
      approve = await dorgContractSigned.approve(sRAddress, amount);
    } catch (error) {
      approve = false
    }
  } else {
    approve = true;
  }
  currentAllowance = await tokenHolderAllowance();
  console.log('current allowance before return: ', currentAllowance)
  return {
    currentETHAddress,
    approve,
    currentAllowance: Number(currentAllowance.dorgStaking),
  };
};
