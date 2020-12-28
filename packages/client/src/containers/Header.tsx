import React, { useState, useEffect } from 'react';
import { getDorgTokenBalance } from '../services';
import { ethers } from 'ethers';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
}));

function Header() {

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
  const balance = await getDorgTokenBalance();
  const balanceRounded = (Math.round(Number(ethers.utils.formatEther(balance)) * 100) / 100).toFixed(3);

    setInputBalance(balanceRounded);
  }

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography variant="h5">dOrg Token Redemption</Typography>
      <Typography variant="body2">balance: {inputBalance} DORG</Typography>
    </div>
  );
}

export default Header;
