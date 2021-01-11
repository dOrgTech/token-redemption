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

function Alert(props: any) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

type props = {
  inputBalance: number;
}

function StakingReward(props: props) {

  const classes = useStyles();

  //DORG token balance of the selected address (user).
  const userInputTokenBalance: number = props.inputBalance;

  //State for each getter of the contract
  const [srApr, setSrApr] = useState('');
  const [rewardsAvailable, setRewardsAvailable] = useState('');
  const [tokensStaked, setTokensStaked] = useState('');

  //Function that fetches all the information needed for the UI from the contract.
  const stakingContractInfo = async (): Promise<any> => {
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
    const currentAddress: Address = await getProviderSelectedAddress();

    const sApr = ethers.utils.formatEther(await StakingRewardSigned.apr());
    const formatsApr = Number(sApr) * (10**16);
    setSrApr(String(formatsApr));

    const sRewardsAvailable = ethers.utils.formatEther(await StakingRewardSigned.rewardsAvailable());
    setRewardsAvailable(sRewardsAvailable);

    const sTokensStaked = ethers.utils.formatEther(await StakingRewardSigned.tokensStaked(currentAddress));
    setTokensStaked(sTokensStaked);

  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      stakingContractInfo();
    },1000)
      return () => {
        clearInterval(intervalId);
      }
  }, []);

  useEffect(() => {
    approveSRDORG();
  }, []);

  const stake = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
    try {
      await StakingRewardSigned.stake(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        handleSnackClick('error');
      }
  }

  const unstake = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
    try {
      await StakingRewardSigned.unstake(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        handleSnackClick('error');
      }
  }

  const unstakeAndClaim = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
    try {
      await StakingRewardSigned.unstakeAndClaim(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        handleSnackClick('error');
      }
  }

  const claimRewards = async (): Promise<any> => {
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
    try {
      await StakingRewardSigned.claimRewards()
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        handleSnackClick('error');
      }
  }

  const claimPartialRewards = async (): Promise<any> => {
    const { token } = Addresses.StakingReward.initializeParams
    const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
    try {
      await StakingRewardSigned.claimPartialRewards(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        handleSnackClick('error');
      }
  }

  //Array of arrays with each card information.
  const stateArray = [[srApr, 'APR (%)', 'Annual percentage rate.'],
                      [rewardsAvailable, 'Rewards Available', 'Amount of DORG tokens you have earned.'],
                      [tokensStaked, 'DORG Tokens Staked', 'Amount of DORG tokens you have staking.']];

  //Function to render a single card, it returns JSX with the parameters for each card.
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

  //Function to render each card with the parameters inside stateArray (array).
  const renderCards = () => {
    return (
      <Box display="flex" justifyContent="center" m={1} p={1}>
        {stateArray.map(renderCard)}
      </Box>
    );
  }

  //State to handle the amount the user inputs.
  const [userAmount, setUserAmount] = useState('');

  const handleAmountChange = (event: any): void => {
    const { value } = event.target;
    const regexp: RegExp = /^\d*\.?\d*$/;
    if(value === '' || regexp.test(value)) {
      setUserAmount(value);
    }
  }

  // Material UI Snackbar & Messages
  const [openSnack, setOpenSnack] = React.useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('');

  const handleSnackClick = (severity: string) => {
    setOpenSnack(true);
    setSnackSeverity(severity);
  };

  const handleSnackClose = (reason: any) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSnack(false);
  };

  //errorCheck vars for input/buttons
  const errorCheck = () => {
    if(Number(userAmount) > userInputTokenBalance) {
      if(Number(userAmount) < Number(tokensStaked)) {
        return false;
      } else {
        return true;
      }
    }
  }

  const errorButtons = Number(userAmount) > userInputTokenBalance || userAmount === '';
  const errorUnstake = Number(userAmount) > Number(tokensStaked) || userAmount === '' || Number(tokensStaked) === 0 || Number(userAmount) > Number(tokensStaked);
  const errorUnstakeAndClaim = Number(rewardsAvailable) === 0 || Number(tokensStaked) === 0 || Number(userAmount) > Number(tokensStaked) || userAmount === '';
  const errorPartialRewards = Number(rewardsAvailable) === 0 || userAmount === '' || Number(userAmount) > userInputTokenBalance;
  const errorClaimRewards = Number(rewardsAvailable) === 0;

  return (
    <Container>
      <Box className="UserInput" display="flex" justifyContent="center" p={1}>
        <TextField
          error={errorCheck()}
          id="input amount"
          label="Enter amount:"
          value={userAmount}
          onChange={handleAmountChange}
          helperText=""
          variant="outlined"/>
      </Box>
      <Box className="ActionButtons" display="flex" justifyContent="center" m={1} p={1}>
        <Button variant="contained" color="primary" title='Stake' onClick={stake} disabled={errorButtons}> Stake </Button>
        <Button variant="contained" color="secondary" title='Unstake' onClick={unstake} disabled={errorUnstake}> Unstake </Button>
        <Button variant="contained" color="secondary" title='Unstake and claim' onClick={unstakeAndClaim} disabled={errorUnstakeAndClaim}> Unstake and Claim </Button>
        <Button variant="contained" color="primary" title='Claim rewards' onClick={claimRewards} disabled={errorClaimRewards}> Claim Rewards </Button>
        <Button variant="contained" color="primary" title='Claim partial rewards' onClick={claimPartialRewards} disabled={errorPartialRewards}> Claim Partial Rewards </Button>
      </Box>
      {renderCards()}

      <div className="Snackbar">
        <Snackbar open={openSnack} autoHideDuration={6000} onClose={handleSnackClose}>
          <Alert onClose={handleSnackClose} severity={snackSeverity}>
            {snackMessage}
          </Alert>
        </Snackbar>
      </div>
    </Container>
  );

}

export default StakingReward;
