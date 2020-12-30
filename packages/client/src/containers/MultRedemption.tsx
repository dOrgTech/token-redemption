import React, { useState, useEffect } from 'react';
import { ethers, Contract, BigNumber, Signer } from 'ethers';
import { getStableRedemptionContract, getSigner } from '../services';
import { Typography, Button, TextField, Dialog, DialogActions, DialogContent,
         DialogContentText, DialogTitle, makeStyles } from '@material-ui/core/';
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Address, EthereumSigner } from '../services/web3';

//types
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

//Material UI
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

function MultRedemption(props: props) {

  const classes = useStyles();
  const regexp: RegExp = /^\d*\.?\d*$/;
  //User inputToken balance
  const userInputTokenBalance: number = props.inputBalance;

  //inputToken amount to be redeemed
  const [inputTokenAmount, setInputTokenAmount] = useState(0);

  const inputTokenNumber: number = Number(inputTokenAmount);
  const handleInputTokenAmount = (event: any): void => {
    const { value } = event.target;
    if(value === '' || regexp.test(value)) {
      setInputTokenAmount(value);
    }
  };

  //Stable Coins amounts to be received
  const [stableUSDC, setStableUSDC] = useState(0);
  const [stableUSDT, setStableUSDT] = useState(0);
  const [stableDAI, setStableDAI] = useState(0);
  const [stableTUSD, setStableTUSD] = useState(0);

  const handleUSDC = (event: any): void => {
    const { value } = event.target;
    if(value === '' || regexp.test(value)) {
      setStableUSDC(value);
    }
  };
  const handleUSDT = (event: any): void => {
    const { value } = event.target;
    if(value === '' || regexp.test(value)) {
      setStableUSDT(value);
    }
  }
  const handleDAI = (event: any): void => {
    const { value } = event.target;
    if(value === '' || regexp.test(value)) {
      setStableDAI(value);
    }
  }
  const handleTUSD = (event: any): void => {
    const { value } = event.target;
    if(value === '' || regexp.test(value)) {
      setStableTUSD(value);
    }
  }

  const stableCoinArr: number[] = [Number(stableUSDC), Number(stableUSDT), Number(stableDAI), Number(stableTUSD)];
  const stableCoinsTotal: number = stableCoinArr.reduce(function(a,b) {
    return a + b;
  }, 0);

  //Function to redeem the inputToken for multiple stable coins.
  const redeemStableMult = async (): Promise<any> => {
    const signer: EthereumSigner = await getSigner();
    const instance: Contract = await getStableRedemptionContract();
    const instanceSigned: Contract = instance.connect(signer as Signer);

    // Amounts calculation
    const stableAmounts: BigNumber[] = stableCoinArr.map((coin) => {
      const ten: BigNumber = ethers.BigNumber.from(10);
      const coinBigNumber: BigNumber = ethers.BigNumber.from(coin);
      return coinBigNumber.mul(ten.pow(18));
    });
    //Token addresses
    const stableTokens: Address[] = stablecoins.map((coin) => {
      return coin.value;
    });

    instanceSigned.redeemMulti(stableTokens, stableAmounts);
    setOpen(false);
  }

  //Messages & effects
  const [confMessage, setConfMessage] = useState('');
  const [stableTotalMessage, setStableTotalMessage] = useState('');

  useEffect(() => {
    setConfMessage((): any => {
      if(inputTokenNumber !== 0 && inputTokenNumber <= userInputTokenBalance) {
        return `${inputTokenAmount} DORG to USDC: ${stableUSDC}, USDT: ${stableUSDT}, DAI: ${stableDAI}, TUSD: ${stableTUSD}`;
      }
    });

    setStableTotalMessage(() => {
      return `Total: ${stableCoinsTotal}`;
    })
  }, [inputTokenAmount, stableUSDC, stableUSDT, stableDAI, stableTUSD]);

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
        <Typography>Swap Multiple Token</Typography>
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
        <Typography>to Stablecoins:</Typography>
        {inputTokenNumber >= stableCoinsTotal ?
        <div>
          <TextField
            id="outlined-select-usdctokenamount"
            label="USDC token amount"
            value={stableUSDC}
            onChange={handleUSDC}
            helperText=""
            variant="outlined"
          />
          <TextField
            id="outlined-select-usdttokenamount"
            label="USDT token amount"
            value={stableUSDT}
            onChange={handleUSDT}
            helperText=""
            variant="outlined"
          />
          <TextField
            id="outlined-select-daitokenamount"
            label="DAI token amount"
            value={stableDAI}
            onChange={handleDAI}
            helperText=""
            variant="outlined"
          />
          <TextField
            id="outlined-select-tusdtokenamount"
            label="TUSD token amount"
            value={stableTUSD}
            onChange={handleTUSD}
            helperText=""
            variant="outlined"
          />
          <Typography>{stableTotalMessage}</Typography>
        </div> :
        <div>
          <TextField
            error
            id="outlined-error-usdctokenamount"
            label="USDC token amount"
            value={stableUSDC}
            onChange={handleUSDC}
            helperText=""
            variant="outlined"
          />
          <TextField
            error
            id="outlined-error-usdttokenamount"
            label="USDT token amount"
            value={stableUSDT}
            onChange={handleUSDT}
            helperText=""
            variant="outlined"
          />
          <TextField
            error
            id="outlined-error-daitokenamount"
            label="DAI token amount"
            value={stableDAI}
            onChange={handleDAI}
            helperText=""
            variant="outlined"
          />
          <TextField
            error
            id="outlined-error-tusdtokenamount"
            label="TUSD token amount"
            value={stableTUSD}
            onChange={handleTUSD}
            helperText=""
            variant="outlined"
          />
          <Typography color="secondary">Inssuficient dOrg tokens!</Typography>
        </div>
       }
      </div>
      <div>
        {inputTokenNumber !== 0 && inputTokenNumber <= userInputTokenBalance && inputTokenNumber === stableCoinsTotal && inputTokenNumber > 0 ?
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
              <Button onClick={redeemStableMult} color="primary" autoFocus>
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

export default MultRedemption;
