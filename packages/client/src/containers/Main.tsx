import React, { useState, useEffect } from 'react';
import { getTokenBalance, getProviderSelectedAddress } from '../services';
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { ethers } from 'ethers';
import { makeStyles, Typography, Container, Box, Button } from '@material-ui/core/';
import { MultRedemption, StakingReward } from './'

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
      padding: '0 30px',
    },
  },
}));

function Main() {

  const [inputBalance, setInputBalance] = useState('');
  const [userAddress, setUserAddress] = useState('')

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkBalance();
      checkAddress();
    },1000)
      return () => {
        clearInterval(intervalId);
      }
  }, [inputBalance, userAddress]);

  //This function checks the address selected by the user.
  const checkAddress = async (): Promise<any> => {
    const address = await getProviderSelectedAddress();

    setUserAddress(address);
  }

  // This function checks the balance of the current
  // provider account and updates the "inputBalance" state.
  const checkBalance = async (): Promise<any> => {
    const { inputToken } = Addresses.StableRedemption.initializeParams;
    const balance: number = await getTokenBalance(inputToken);
    const balanceRounded: string = (Math.round(Number(ethers.utils.formatEther(balance)) * 100) / 100).toFixed(2);

    setInputBalance(balanceRounded);
  }

  const [flag, setFlag] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const handleRedeem = () => {
    setFlag(false);
    setDisabled(true);
  }
  const handleStake = () => {
    setFlag(true);
    setDisabled(false);
  }

  const classes = useStyles();


  return (
    <Container className={classes.root}>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Typography variant="h5">dOrg Token Dashboard</Typography>
      </Box>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Button variant="contained" color="primary" onClick={handleRedeem} disabled={disabled} title='Redeem Tokens'>Redeem Tokens</Button>
        <Button variant="contained" color="secondary" onClick={handleStake} disabled={flag} title='Stake Tokens'>Stake Tokens</Button>
      </Box>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Typography variant="body2">{userAddress}</Typography>
      </Box>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Typography variant="body2">Your balance: {inputBalance} DORG</Typography>
      </Box>
      {flag === false ? <MultRedemption inputBalance={Number(inputBalance)} />
        : <StakingReward inputBalance={Number(inputBalance)} />}
    </Container>
  );
}

export default Main;
