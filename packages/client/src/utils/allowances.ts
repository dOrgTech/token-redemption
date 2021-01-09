import ERC20 from "@dorgtech/dorg-token-contracts/artifacts/TestERC20.json";
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Contract, BigNumber } from "ethers";
import { Web3, Address } from "../services/web3";
import { getSigner, getTokenBalance, getProviderSelectedAddress } from "../services"
import { bigNumberifyAmount } from './'

type Allowance = {
  dorg: number,
}

const divideNumberByDecimals = (num: number, decimals: number) => {
  return num/Math.pow(10, decimals);
}

const tokenBalance = async (): Promise<any> => {
  const currentETHAddress: Address = await getProviderSelectedAddress();
  const { inputToken } = Addresses.StableRedemption.initializeParams;

  const DORGAmount: number = await getTokenBalance(inputToken);

  return {
    currentETHAddress,
    DORGAmount: divideNumberByDecimals(Number(DORGAmount), 18),
  };
};

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

export const tokenHolderAllowance = async (): Promise<any> => {
  const dorg: Allowance = await tokenAllowanceDORG();
  return {
    dorg: Number(dorg) / Math.pow(10, 18),
  };
};

export const approveDORG = async (): Promise<any> => {
  const { abi } = ERC20;
  const sRAddress: Address = Addresses.StableRedemption.address;
  const { inputToken } = Addresses.StableRedemption.initializeParams;
  const signer = await getSigner();

  const { DORGAmount } = await tokenBalance();
  const currentETHAddress: Address = await getProviderSelectedAddress();
  const amount: BigNumber = await bigNumberifyAmount(DORGAmount, inputToken)
  const web3 = await Web3.getInstance();
  const dorgContract: Contract = await web3.getContract(inputToken, abi) as any;
  const dorgContractSigned: Contract = dorgContract.connect(signer);

  let currentAllowance: Allowance = await tokenHolderAllowance();
  let approve: boolean = false;
  if (currentAllowance.dorg < DORGAmount) {
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
