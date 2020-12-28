import fs from "fs";
import { ethers } from "@nomiclabs/buidler";
//import { exec, ExecException } from "child_process";

const network = process.env.NETWORK || 'undefined';

export async function deployAndVerify(
  name: string,
  log: (address: string, tx: string) => void
) {
  const factory = await ethers.getContract(name);
  const contract = await factory.deploy();
  log(contract.address, contract.deployTransaction.hash!);
  await contract.deployed();
  await new Promise((resolve) =>
    setTimeout(() => resolve(), 30000)
  );

  // await new Promise((resolve, reject) =>
  //   exec(
  //     `npx buidler verify-contract --contract-name ${name} --address ${contract.address} --show-stack-traces`,
  //     {
  //       cwd: `${__dirname}/../`
  //     },
  //     (error: ExecException | null, stdout: string, stderr: string) => {
  //       if (error !== null) {
  //         console.log(stdout);
  //         console.error(stderr);
  //         reject(new Error(error.message));
  //       } else {
  //         console.log(stdout);
  //         resolve();
  //       }
  //     }
  //   )
  // );
  return contract;
}

export function loadConfig(contract: string) {
  const config = require("../config.json");
  const configNetwork = config[network];

  if (!configNetwork) {
    throw Error(`Error: No config found for network { "${network}" }`);
  }

  const networkContract = configNetwork[contract];

  if (!networkContract) {
    throw Error(`Error: No config found for network contract { "${network}" : "${contract}" }`);
  }

  return networkContract;
}

export function logDeployment(log: any, contract: string) {
  const time = Date.now();
  const filename = `${time}-${network}-${contract}.json`;
  fs.writeFileSync(
    `${__dirname}/../logs/${filename}`,
    //`${__dirname}/../artifacts/Addresses.json`,
    JSON.stringify(log, null, 2)
  );
}
