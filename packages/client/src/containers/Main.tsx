import React, { useState, useEffect } from 'react';
import { getTokenBalance } from '../services';
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { ethers } from 'ethers';
import { makeStyles, Typography, Container, Box } from '@material-ui/core/';
import { MultRedemption } from './'

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkBalance();
    },1000)
      return () => {
        clearInterval(intervalId);
      }
  }, [inputBalance]);

  // This function checks the balance of the current
  // provider account and updates the "inputBalance" state.
  const checkBalance = async (): Promise<any> => {
    const { inputToken } = Addresses.StableRedemption.initializeParams;
    const balance: number = await getTokenBalance(inputToken);
    const balanceRounded: string = (Math.round(Number(ethers.utils.formatEther(balance)) * 100) / 100).toFixed(2);

    setInputBalance(balanceRounded);
  }

  const classes = useStyles();

  
  return (
    <Container className={classes.root}>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Typography variant="h5">dOrg Token Redemption</Typography>
      </Box>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Typography variant="body2">Your balance: {inputBalance} DORG</Typography>
      </Box>
      <MultRedemption inputBalance={Number(inputBalance)} />
    </Container>
  );
}

export default Main;
