import { Signer, providers, Contract } from "ethers";

const { Web3Provider } = providers;

export type Address = string;
export type AccountIndex = number;
export type EthereumSigner = Signer | Address | AccountIndex;
export type EthereumProvider = string | providers.ExternalProvider;
export type EthereumClient = providers.JsonRpcProvider | providers.Web3Provider;

export interface IWeb3Provider {
  provider: EthereumProvider;
  signer?: EthereumSigner;
  ens?: Address;
  getSigner: any;
  listAccounts: any;
  getNetwork: any;
}

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
  public signer: EthereumSigner | null = null;

  private async initialize() {

    if ((window as any).web3 !== undefined) {
      try {
        // Use MetaMask provider IF user has metamask downloaded
        await (window as any).ethereum.enable();
        this.provider = new Web3Provider((window as any).ethereum);
        //console.log('this.provider', this.provider)
        this.signer = this.provider!.getSigner();
        // console.log("this.signer, this.signer?.getGasPrice()", this.signer?.getGasPrice())
      } catch (error) {
        console.log('Error instanciating Web3 Class', error)
      }
    } else {
        return undefined;
    }
  }

  public getDefaultAddress = async () => {
    const signer: any = this.provider!.signer;
    const address: Address = await signer!.getAddress();
    return address;
  };

  public getAccounts = async () => {
    const accounts: string[] = this.provider!.listAccounts();
    return accounts;
  }

  public getWeb3 = async () => {
    return (this.provider) as EthereumClient;
  };

  public getSigner = async () => {
    return (this.signer) as EthereumSigner;
  };

  public getNetwork = async () => {
    const network = await this.provider!.getNetwork();
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
    const endpoint = address;
    const response = await fetch(endpoint);
    return await response.json();
  }

  public getTxStatusByProxy = async (proxyAddress: string) => {
    const endpoint = proxyAddress;
    const response = await fetch(endpoint);
    return await response.json();
  }

  public getContract = async (address: string, abi: any) => {
    const contract = new Contract(address, abi, this.provider! as EthereumClient);
    return contract;
  }

}
