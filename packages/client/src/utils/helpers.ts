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
    const intAmount: number = Math.trunc(Number(coin._amount))
    const decimalsAmount: number = Number(coin._amount) - intAmount;
    if(decimalsAmount > 0) {
      const deciAmountToInt: string[] = String(coin._amount).split('.');
      const deciAmount: string = deciAmountToInt[1];
      const deciLength: number = deciAmount.length
      //BigNumbers
      const ten: BigNumber = ethers.BigNumber.from(10);
      const intBn: BigNumber = ethers.BigNumber.from(intAmount).mul(ten.pow(tokenDecimals));
      const deciBn: BigNumber = ethers.BigNumber.from(deciAmount).mul(ten.pow(tokenDecimals-deciLength));
      const amountBn: BigNumber = intBn.add(deciBn)

      return amountBn;
  } else {
      const ten: BigNumber = ethers.BigNumber.from(10);
      const intBn: BigNumber = ethers.BigNumber.from(intAmount).mul(ten.pow(tokenDecimals));

      return intBn;
  }
  });
  return bigNumberArray;
}

export const bigNumberifyAmount = async (amount: number, coin: Address): Promise<any> => {
  const tokenDecimals: number = await getTokenDecimals(coin);
  const intAmount: number = Math.trunc(Number(amount))
  const decimalsAmount: number = Number(amount) - intAmount;
  if(decimalsAmount > 0) {
    const deciAmountToInt: string[] = String(amount).split('.');
    const deciAmount: string = deciAmountToInt[1];
    const deciLength: number = deciAmount.length
    //BigNumbers
    const ten: BigNumber = ethers.BigNumber.from(10);
    const intBn: BigNumber = ethers.BigNumber.from(intAmount).mul(ten.pow(tokenDecimals));
    const deciBn: BigNumber = ethers.BigNumber.from(deciAmount).mul(ten.pow(tokenDecimals-deciLength));
    const amountBn: BigNumber = intBn.add(deciBn)

    return amountBn;
} else {
    const ten: BigNumber = ethers.BigNumber.from(10);
    const intBn: BigNumber = ethers.BigNumber.from(intAmount).mul(ten.pow(tokenDecimals));

    return intBn;
  }
}
