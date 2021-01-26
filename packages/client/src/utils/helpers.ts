import { ethers, BigNumber } from 'ethers';
import { Address } from '../services/web3';
import { getTokenDecimals } from '../services'

export type StableCoin = {
  address: Address,
  label: string,
  logo?: string,
  contractBalance: number,
  _amount: number
}

// This function gets an array of Stablecoins and returns an array of the amounts of each Stablecoin in BigNumber
export const bigNumberifyAmounts = async (array: StableCoin[]): Promise<any> => {
  const bigNumberArray = array.map(async (coin) => {
    const tokenDecimals: number = await getTokenDecimals(coin.address);
    const intAmount: string = String(Math.trunc(Number(coin._amount)));
    const sAmount: string = String(coin._amount).replace('.', '');
    //BigNumber
    const ten: BigNumber = ethers.BigNumber.from(10);
    const amountBn: BigNumber = ethers.BigNumber.from(sAmount).mul(ten.pow(tokenDecimals-(sAmount.length-intAmount.length)));

    return amountBn;
  });

  return bigNumberArray;
}

export const bigNumberifyAmount = async (amount: number, coin: Address): Promise<any> => {
  const tokenDecimals: number = await getTokenDecimals(coin);
  const intAmount: string = String(Math.trunc(Number(amount)));
  const sAmount: string = String(amount).replace('.', '');
  //BigNumber
  const ten: BigNumber = ethers.BigNumber.from(10);
  const amountBn: BigNumber = ethers.BigNumber.from(sAmount).mul(ten.pow(tokenDecimals-(sAmount.length-intAmount.length)));

  return amountBn;

}
