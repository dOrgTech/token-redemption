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

export const bigNumberifyAmounts = async (array: StableCoin[]): Promise<any> => {
  const bigNumberArray = array.map(async (coin) => {
    const tokenDecimals: number = await getTokenDecimals(coin.address);
    const intAmount: number = Math.trunc(Number(coin._amount))
    const deciAmountToInt: string[] = String(coin._amount).split('.');
    const deciAmount: string = deciAmountToInt[1];
    const deciLength: number = (deciAmount.length)
    //BigNumbers
    const ten: BigNumber = ethers.BigNumber.from(10);
    const intBn: BigNumber = ethers.BigNumber.from(intAmount).mul(ten.pow(tokenDecimals));
    const deciBn: BigNumber = ethers.BigNumber.from(deciAmount).mul(ten.pow(tokenDecimals-deciLength));
    const amountBn: BigNumber = intBn.add(deciBn)

    return amountBn;
  });
  return bigNumberArray;
}
