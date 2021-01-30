import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";
import * as dotenv from "dotenv";

dotenv.config();

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("buidler-typechain");
usePlugin("solidity-coverage");
usePlugin("@nomiclabs/buidler-solhint");

const {
  INFURA_API_KEY,
  PRIVATE_KEY,
  ETHERSCAN_API_KEY
} = process.env

const config: BuidlerConfig = {
  solc: {
    version: "0.5.16",
    optimizer: {
      enabled: true,
    }
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY!],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY!]
    },
    xdai: {
      url: 'https://xdai.poanetwork.dev',
      accounts: [PRIVATE_KEY!]
    },
    coverage: {
      url: 'http://127.0.0.1:8555' // Coverage launches its own ganache-cli client
    }
  },
  etherscan: {
    // The url for the Etherscan API you want to use.
    // Right now is for rinkeby
    url: "https://api-rinkeby.etherscan.io/api",
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY!,
  },
  typechain: {
    outDir: "types",
    target: "ethers-v4",
  },
};

export default config;
