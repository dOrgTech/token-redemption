import React, { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import { Address } from '../services/web3';
import { bigNumberifyAmount, approveSRDORG } from '../utils'
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { getStakingRewardContractSigned, getProviderSelectedAddress } from '../services';
import { Typography, Button, TextField, Dialog, DialogActions, DialogContent,
         DialogContentText, DialogTitle, Container, makeStyles, Box, Snackbar,
         Card, CardContent } from '@material-ui/core/';
import MuiAlert from '@material-ui/lab/Alert';

const useStyles = makeStyles({
  card: {
    width: 300,
    height: 100,
    marginRight: 10,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.5)',
  },
  title: {
    fontSize: 20,
  },
  pos: {
    marginBottom: 12,
  },
});

type props = {
  inputBalance: number;
}

function StakingReward(props: props) {

  const classes = useStyles();

  const userInputTokenBalance: number = props.inputBalance;

  //getters of the contract
  const [srApr, setSrApr] = useState('');
  const [rewardsAvailable, setRewardsAvailable] = useState('');
  const [tokensStaked, setTokensStaked] = useState('');

  const stakingContractInfo = async (): Promise<any> => {
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
    const currentAddress: Address = await getProviderSelectedAddress();

    const sApr = ethers.utils.formatEther(await StakingRewardSigned.apr());
    setSrApr(sApr);

    const sRewardsAvailable = ethers.utils.formatEther(await StakingRewardSigned.rewardsAvailable());
    setRewardsAvailable(sRewardsAvailable);

    const sTokensStaked = ethers.utils.formatEther(await StakingRewardSigned.tokensStaked(currentAddress));
    setTokensStaked(sTokensStaked);

  }

  useEffect(() => {
    stakingContractInfo();
    approveSRDORG();
  }, []);

  const stake = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();


    StakingRewardSigned.stake(bigNumberifyAmount(Number(userAmount), token));
  }

  const unstake = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();

    StakingRewardSigned.unstake(bigNumberifyAmount(Number(userAmount), token));
  }

  const unstakeAndClaim = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();

    StakingRewardSigned.unstakeAndClaim(bigNumberifyAmount(Number(userAmount), token));
  }

  const claimRewards = async (): Promise<any> => {
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();

    StakingRewardSigned.claimRewards();
  }

  const claimPartialRewards = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();

    StakingRewardSigned.claimPartialRewards(bigNumberifyAmount(Number(userAmount), token));
  }

  const stateArray = [[srApr, 'APR (%)', 'Annual percentage rate.'],
                      [rewardsAvailable, 'Rewards Available', 'Amount of DORG tokens you have earned.'],
                      [tokensStaked, 'DORG Tokens Staked', 'Amount of DORG tokens you have staking.']];

  const renderCard = (state: any) => {
    return (
      <Card key={state[1]} className={classes.card}>
        <CardContent>
          <Typography className={classes.title} variant="h5" component="h2">
            {state[1]}
          </Typography>
          <Typography className={classes.pos} color="textSecondary">
            {state[0]}
          </Typography>
          <Typography className={classes.pos} variant="caption" color="textSecondary">
            {state[2]}
          </Typography>
        </CardContent>
      </Card>
    )
  }
  const renderCards = () => {
    return (
      <Box display="flex" justifyContent="center" m={1} p={1}>
        {stateArray.map(renderCard)}
      </Box>
    );
  }

  const [userAmount, setUserAmount] = useState('');

  const handleAmountChange = (event: any): void => {
    const { value } = event.target;
    const regexp: RegExp = /^\d*\.?\d*$/;
    if(value === '' || regexp.test(value)) {
      setUserAmount(value);
    }
  }

  const errorCoins = Number(userAmount) > userInputTokenBalance;
  const errorButtons = Number(userAmount) > userInputTokenBalance || userAmount === '';
  const errorUnstake = Number(userAmount) > userInputTokenBalance || userAmount === '' || Number(tokensStaked) === 0 || Number(userAmount) > Number(tokensStaked);
  const errorUnstakeAndClaim = Number(rewardsAvailable) === 0 || Number(tokensStaked) === 0 || Number(userAmount) > Number(tokensStaked) || userAmount === '' || Number(userAmount) > userInputTokenBalance;
  const errorPartialRewards = Number(rewardsAvailable) === 0 || userAmount === '' || Number(userAmount) > userInputTokenBalance;
  const errorClaimRewards = Number(rewardsAvailable) === 0;

  return (
    <Container>
      <Box display="flex" justifyContent="center" p={1}>
        <TextField
          error={errorCoins}
          id="input amount"
          label="Enter amount:"
          value={userAmount}
          onChange={handleAmountChange}
          helperText=""
          variant="outlined"/>
      </Box>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Button variant="contained" color="primary" title='Stake' onClick={stake} disabled={errorButtons}> Stake </Button>
        <Button variant="contained" color="secondary" title='Unstake' onClick={unstake} disabled={errorUnstake}> Unstake </Button>
        <Button variant="contained" color="secondary" title='Unstake and claim' onClick={unstakeAndClaim} disabled={errorUnstakeAndClaim}> Unstake and Claim </Button>
        <Button variant="contained" color="primary" title='Claim rewards' onClick={claimRewards} disabled={errorClaimRewards}> Claim Rewards </Button>
        <Button variant="contained" color="primary" title='Claim partial rewards' onClick={claimPartialRewards} disabled={errorPartialRewards}> Claim Partial Rewards </Button>
      </Box>
      {renderCards()}
    </Container>
  );

}

export default StakingReward;
