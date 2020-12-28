import { Signer, providers, BigNumber, ethers, Contract } from "ethers";

type IWeb3Provider = any;

export { Signer, BigNumber, ethers };

const { Web3Provider } = providers

export class Web3 {
  private constructor() {}

  private static _instance: Web3;

  public static async getInstance() {
    if (!this._instance) {
      const instance = new Web3();
      await instance.initialize();
      this._instance = instance;
    }
    return this._instance;
  }

  public provider: IWeb3Provider | null = null;
  public signer: Signer | null = null;
  public proxyKit: any = null;
  public contracts: any = [];

  private async initialize() {
    try {
      // Use MetaMask provider IF user has metamask downloaded
      await (window as any).ethereum.enable();
      this.provider = new Web3Provider((window as any).ethereum);
      // console.log('this.provider', this.provider)
      this.signer = await this.provider.getSigner();
      // console.log("this.signer, this.signer?.getGasPrice()", this.signer?.getGasPrice())
    } catch (error) {
      console.log('Error instanciating Web3 Class', error)
    }
  }

  public getDefaultAddress = async () => {
    const signer = await this.provider!.getSigner();
    const address = await signer!.getAddress();
    return address;
  };

  public getWeb3 = async () => {
    return (await this.provider) as IWeb3Provider;
  };

  public getNetwork = async () => {
    const network = await this.provider?.getNetwork();
    return network;
  }

  public getNetworkName = async () => {
    const network = await this.getNetwork();
    const name = network.name === "homestead" ? "mainnet" : network.name;
    return name
  };

  public getNetworkId = async () => {
    const network = await this.getNetwork();
    const id = network!.chainId;
    return id
  };

  public getTxStatus = async (address: string) => {
    const endpoint = ``;
    const response = await fetch(endpoint);
    return await response.json();
  }

  public getTxStatusByProxy = async (proxyAddress: string) => {
    const endpoint = ``;
    const response = await fetch(endpoint);
    return await response.json();
  }

  public getContract = async (address: string, abi: any) => {
    const contract = new Contract(address, abi, this.provider);
    return contract;
  }

}
