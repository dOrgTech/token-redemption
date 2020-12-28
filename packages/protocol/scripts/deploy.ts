import {
  deployAndVerify,
  loadConfig,
  logDeployment
} from "./common";

const getContracts = () => process.env.DEPLOY_CONTRACTS?.split(',');

const log: any = { }

async function main() {
  const contracts = getContracts();

  if (!contracts) {
    throw Error(`Error: env.DEPLOY_CONTRACTS isn't defined`);
  }

  for (const contract of contracts) {
    const config = loadConfig(contract);

    const sc = await deployAndVerify(
      contract, (address, tx) =>
      log[contract] = { address, tx }
    );

    if(contract === 'StableRedemption') {
      await sc.initialize(config.owner, config.inputToken, config.redemptionTokens)
    } else if(contract === 'StakingReward') {
      await sc.initialize(config.owner, config.token, config.apr)
    };

    log[contract].initializeParams = {
      ...config
    };

    logDeployment(log, contract);
    console.log(`Succesfully deployed: ${contract} at address: ${log[contract].address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
