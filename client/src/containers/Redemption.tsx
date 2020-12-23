import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getStableRedemptionContract, getSigner } from '../services';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

//rinkeby stablecoin contracts
const stablecoins = [
  {
    value: "0xec11d004548C393de05Cc91eCA3eC411F0DE0dFb",
    label: 'USDC',
  },
  {
    value: "0xA7F42De18799F62718fB80FCea59cC2713c45412",
    label: 'USDT',
  },
  {
    value: "0x97D570eA0320946AF6BA7f8B40840947a228f6Bf",
    label: 'DAI',
  },
  {
    value: "0x71144d684f4C3F0cBA08aEe4FE1945C30a4CF631",
    label: 'TUSD',
  },
];

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
    '& .MuiTextField-root': {
      margin: theme.spacing(1),
      width: 200,
    },
  },
}));

function Redemption() {

  const classes = useStyles();

  const [inputTokenAmount, setInputTokenAmount] = useState(0);

  const handleDorgTokenAmount = (event: any) => {
    setInputTokenAmount(event.target.value);
  };

  const [stablecoin, setStablecoin] = useState('');
  const [stablename, setStablename] = useState('');


  const handleStablecoin = (event: any) => {
    const { value } = event.target;
    setStablecoin(value);
    const labels = stablecoins.filter((coin) => {
      return coin.value === value;
    })
    const { label } = labels[0];
    setStablename(label);
  };

  const redeemStable = async (): Promise<any> => {
    const signer = await getSigner();
    const instance = await getStableRedemptionContract();
    const instanceSigned = await instance.connect(signer);
    const amount = ethers.BigNumber.from(inputTokenAmount);
    const ten = ethers.BigNumber.from(10);
    const amount18 = amount.mul(ten.pow(18));

    instanceSigned.redeem(stablecoin, amount18);
  }

  const [confMessage, setConfMessage] = useState('');

  useEffect(() => {
    setConfMessage((): any => {
      if(inputTokenAmount !== 0 && stablecoin !== '') {
        return `Please confirm you want to redeem: ${inputTokenAmount} DORG to ${stablename}`;
      }
    });
  })

  return (
    <form className={classes.root} noValidate autoComplete="off">
      <div>
        <br></br>
        <Typography>Swap Token</Typography>
        <TextField
          id="outlined-select-dorgtokenamount"
          label="DORG token amount"
          value={inputTokenAmount}
          onChange={handleDorgTokenAmount}
          helperText=""
          variant="outlined"
        />
      </div>
      <div>
        <br></br>
        <Typography>to Stablecoin:</Typography>
        <TextField
          id="outlined-select-stablecoin"
          select
          label="Select Stablecoin"
          value={stablecoin}
          onChange={handleStablecoin}
          helperText=""
          variant="outlined"
        >
          {stablecoins.map((option) => {
            const { value, label } = option;
            return (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            )
          })}
        </TextField>
      </div>
      <div>
        <br></br>
        <Typography>{confMessage}</Typography>
      </div>
      <div>
        <Button variant="contained" color="primary" onClick={redeemStable}> Redeem </Button>
      </div>
    </form>
  );
}

export default Redemption;
