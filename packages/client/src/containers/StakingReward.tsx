import React, { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import { Address } from '../services/web3';
import { bigNumberifyAmount, approveSRDORG, roundNumber } from '../utils'
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

  //Getting current allowance
  const getInputTokenAllowance = async(): Promise<any> => {
    try {
      await approveSRDORG();
    } catch(err) {
      console.log(err.message);
    }
  };

  //State for each getter of the contract
  const [srApr, setSrApr] = useState('');
  const [rewardsAvailable, setRewardsAvailable] = useState('');
  const [tokensStaked, setTokensStaked] = useState('');
  const [calculateStakeRewards, setCalculateStakeRewards] = useState('');

  //Function that fetches all the information needed for the UI from the contract.
  const stakingContractInfo = async (): Promise<any> => {
    try {
      const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
      const currentAddress: Address = await getProviderSelectedAddress();
      const sApr = ethers.utils.formatEther(await StakingRewardSigned.apr());
      const formatsApr = Number(sApr) * (10**16);
      setSrApr(String(formatsApr));

      const sRewardsAvailable = ethers.utils.formatEther(await StakingRewardSigned.rewardsAvailable());
      setRewardsAvailable(sRewardsAvailable);

      const sTokensStaked = ethers.utils.formatEther(await StakingRewardSigned.tokensStaked(currentAddress));
      setTokensStaked(sTokensStaked);

      const cStakeRewards = ethers.utils.formatEther(await StakingRewardSigned.calculateStakeRewards(currentAddress));
      setCalculateStakeRewards(cStakeRewards);
    } catch(err) {
      setSrApr('');
      setRewardsAvailable('');
      setTokensStaked('');
      setCalculateStakeRewards('');
    }
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
    getInputTokenAllowance();
  }, []);

  // Function to interact with the Stake method of the contract
  const stake = async (): Promise<any> => {
    try {
      const { token } = Addresses.StakingReward.initializeParams
      const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
      await StakingRewardSigned.stake(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          setOpenConf(false);
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        setOpenConf(false);
        handleSnackClick('error');
      }
  }

  // Function to interact with the Unstake method of the contract
  const unstake = async (): Promise<any> => {
    try {
      const { token } = Addresses.StakingReward.initializeParams
      const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
      await StakingRewardSigned.unstake(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          setOpenConf(false);
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        setOpenConf(false);
        handleSnackClick('error');
      }
  }

// Function to interact with the unstakeAndClaim method of the contract
  const unstakeAndClaim = async (): Promise<any> => {
    try {
      const { token } = Addresses.StakingReward.initializeParams
      const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
      await StakingRewardSigned.unstakeAndClaim(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          setOpenConf(false);
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        setOpenConf(false);
        handleSnackClick('error');
      }
  }

  // Function to interact with the claimRewards method of the contract
  const claimRewards = async (): Promise<any> => {
    try {
      const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
      await StakingRewardSigned.claimRewards()
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          setOpenConf(false);
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        setOpenConf(false);
        handleSnackClick('error');
      }
  }

  // Function to interact with the claimPartialRewards method of the contract
  const claimPartialRewards = async (): Promise<any> => {
    try {
      const { token } = Addresses.StakingReward.initializeParams
      const StakingRewardSigned: Contract = await getStakingRewardContractSigned();
      await StakingRewardSigned.claimPartialRewards(bigNumberifyAmount(Number(userAmount), token))
        .then(() => {
          setSnackMessage('Your transaction was sent to Metamask!')
          setOpenConf(false);
          handleSnackClick('success')
          setUserAmount('')
        });
      } catch(err) {
        setSnackMessage(err.message)
        setOpenConf(false);
        handleSnackClick('error');
      }
  }

  //Array of arrays with each card information.
  const totalTokensStaked:number = roundNumber(Number(tokensStaked) + Number(calculateStakeRewards), '18');
  const stateArray: any[] = [[srApr, 'APR (%)', 'Annual percentage rate.'],
                      [rewardsAvailable, 'Rewards Available', 'Amount of DXRG tokens you have earned.'],
                      [totalTokensStaked, 'DXRG Tokens Staked', 'Amount of DXRG tokens you have staking.']];

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
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [openSnack, setOpenSnack] = useState(false);
  const [openConf, setOpenConf] = useState(false);
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

  const dialogAction = () => {
    if(dialogTitle === 'stake') {
      return stake();
    } else if(dialogTitle === 'unstake') {
      return unstake();
    } else if(dialogTitle === 'unstake and claim') {
      return unstakeAndClaim();
    } else if(dialogTitle === 'claim rewards') {
      return claimRewards();
    } else if(dialogTitle === 'claim partial rewards') {
      return claimPartialRewards();
    }
  }

  const handleClickOpen = (event: string) => {
    if(event === 'stake') {
      setDialogTitle('stake')
      setDialogMessage(`${userAmount} DXRG`);
    } else if(event === 'unstake') {
      setDialogTitle('unstake')
      setDialogMessage(`${userAmount} DXRG`);
    } else if(event === 'unstake and claim') {
      setDialogTitle('unstake and claim')
      setDialogMessage(`Unstake ${userAmount} DXRG and claim ${rewardsAvailable} DXRG from rewards`);
    } else if(event === 'claim rewards') {
      setDialogTitle('claim rewards')
      setDialogMessage(`${rewardsAvailable} DXRG from rewards`);
    } else if(event === 'claim partial rewards') {
      setDialogTitle('claim partial rewards')
      setDialogMessage(`${userAmount} DXRG from rewards`);
    }
    setOpenConf(true);
  };

  const handleClose = () => {
    setOpenConf(false);
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

  const errorButtons = Number(userAmount) > userInputTokenBalance || userAmount === '' || userAmount === '0';
  const errorUnstake = Number(userAmount) > Number(tokensStaked) || userAmount === '' || userAmount === '0' || Number(tokensStaked) === 0 || Number(userAmount) > Number(tokensStaked);
  const errorUnstakeAndClaim = Number(rewardsAvailable) === 0 || Number(tokensStaked) === 0 || Number(userAmount) > Number(tokensStaked) || userAmount === '' || userAmount === '0';
  const errorPartialRewards = Number(rewardsAvailable) === 0 || userAmount === '' || userAmount === '0' || Number(userAmount) > userInputTokenBalance || Number(userAmount) > Number(rewardsAvailable);
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
        <Button variant="contained" color="primary" id="Stake" title='Stake' onClick={() => { handleClickOpen('stake') }} disabled={errorButtons}> Stake </Button>
        <Button variant="contained" color="secondary" id="Unstake" title='Unstake' onClick={() => { handleClickOpen('unstake') }} disabled={errorUnstake}> Unstake </Button>
        <Button variant="contained" color="secondary" id="Unstake and claim" title='Unstake and claim' onClick={() => { handleClickOpen('unstake and claim') }} disabled={errorUnstakeAndClaim}> Unstake and Claim </Button>
        <Button variant="contained" color="primary" id="Claim rewards" title='Claim rewards' onClick={() => { handleClickOpen('claim rewards') }} disabled={errorClaimRewards}> Claim Rewards </Button>
        <Button variant="contained" color="primary" id="Claim partial rewards" title='Claim partial rewards' onClick={() => { handleClickOpen('claim partial rewards') }} disabled={errorPartialRewards}> Claim Partial Rewards </Button>
      </Box>
      {renderCards()}

      <Dialog
      open={openConf}
      onClose={handleClose}
      aria-labelledby="confirm-dialog"
      aria-describedby="dialog-to-confirm-your-transaction">
      <DialogTitle id="confirm-dialog">{`Are you sure you want to ${dialogTitle} ?`}</DialogTitle>
      <DialogContent>
        <DialogContentText id="dialog-to-confirm-your-transaction">
          {dialogMessage}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={dialogAction} color="primary" autoFocus>
          Confirm
        </Button>
      </DialogActions>
      </Dialog>

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
