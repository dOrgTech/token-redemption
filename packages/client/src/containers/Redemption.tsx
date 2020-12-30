import React, { useState, useEffect } from 'react';
import { ethers, Contract, BigNumber, Signer } from 'ethers';
import { getStableRedemptionContract, getSigner } from '../services';
import { Typography, Button, TextField, MenuItem, Dialog, DialogActions, DialogContent,
         DialogContentText, DialogTitle, makeStyles } from '@material-ui/core/';
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Address, EthereumSigner } from '../services/web3';

type StableCoin = {
  value: Address,
  label: string
}
type props = {
  inputBalance: number;
}

//rinkeby stablecoin contracts
const { redemptionTokens } = Addresses.StableRedemption.initializeParams;
const stablecoins: StableCoin[] = [
  {
    value: redemptionTokens[0],
    label: 'USDC',
  },
  {
    value: redemptionTokens[1],
    label: 'USDT',
  },
  {
    value: redemptionTokens[2],
    label: 'DAI',
  },
  {
    value: redemptionTokens[3],
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

function Redemption(props: props) {

  const classes = useStyles();
  const regexp: RegExp = /^\d*\.?\d*$/;

  //User inputToken balance
  const userInputTokenBalance: number = props.inputBalance;

  const [inputTokenAmount, setInputTokenAmount] = useState(0);

  const inputTokenNumber: number = Number(inputTokenAmount);
  const handleInputTokenAmount = (event: any): void => {
    const { value } = event.target;
    if(value === '' || regexp.test(value)) {
      setInputTokenAmount(value);
    }
  };

  //Stablecoin handling
  const [stablecoin, setStablecoin] = useState('');
  const [stablename, setStablename] = useState('');


  const handleStablecoin = (event: any): void => {
    const { value } = event.target;
    setStablecoin(value);

    const labels = stablecoins.filter((coin) => {
      return coin.value === value;
    })
    const { label } = labels[0];
    setStablename(label);
  };

  //Function to redeem the inputToken for a StableCoin
  const redeemStable = async (): Promise<any> => {
    const signer: EthereumSigner = await getSigner();
    const instance: Contract = await getStableRedemptionContract();
    const instanceSigned: Contract = instance.connect(signer as Signer);
    const amount: BigNumber = ethers.BigNumber.from(Number(inputTokenAmount));
    const ten: BigNumber = ethers.BigNumber.from(10);
    const amount18: BigNumber = amount.mul(ten.pow(18));

    instanceSigned.redeem(stablecoin, amount18);
    setOpen(false);
  }

  //Messages
  const [confMessage, setConfMessage] = useState('');

  useEffect(() => {
    setConfMessage((): any => {
      if(inputTokenNumber !== 0 && stablecoin !== '' && inputTokenNumber <= userInputTokenBalance) {
        return `${inputTokenAmount} DORG to ${stablename}`;
      }
    });
  }, [inputTokenAmount, stablecoin, stablename])

  //Material UI Dialog
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <form className={classes.root} noValidate autoComplete="off">
      <div>
        <br></br>
        <Typography>Swap Token</Typography>
        {inputTokenNumber <= userInputTokenBalance ?
        <TextField
          id="outlined-select-dorgtokenamount"
          label="DORG token amount"
          value={inputTokenAmount}
          onChange={handleInputTokenAmount}
          helperText=""
          variant="outlined"
        /> :
        <TextField
          error
          id="outlined-error-dorgtokenamount"
          label="insufficient funds"
          value={inputTokenAmount}
          onChange={handleInputTokenAmount}
          helperText="You do not have enough dOrg tokens!"
          variant="outlined"
        />
       }
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
        {inputTokenNumber !== 0 && stablecoin !== '' && inputTokenNumber <= userInputTokenBalance && inputTokenNumber > 0 ?
        <div>
          <Button variant="contained" color="primary" onClick={handleClickOpen}> Redeem </Button>
          <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Are you sure you want to redeem?"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {confMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={redeemStable} color="primary" autoFocus>
              Confirm
            </Button>
          </DialogActions>
          </Dialog>
        </div>
         :
        <Button variant="contained" disabled> Redeem </Button>}
      </div>
    </form>
  );
}

export default Redemption;
