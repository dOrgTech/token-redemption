import React, { useState, useEffect, Fragment } from 'react';
import { ethers, Contract, BigNumber, Signer } from 'ethers';
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Address, EthereumSigner } from '../services/web3';
import { getStableRedemptionContract, getSigner, getTokenBalance } from '../services';
import { Typography, Button, TextField, Dialog, DialogActions, DialogContent,
         DialogContentText, DialogTitle, Container, CssBaseline, makeStyles } from '@material-ui/core/';
import { daiLogo, usdcLogo, tusdLogo, usdtLogo } from '../assets';

//types
type StableCoin = {
  address: Address,
  label: string,
  logo?: string,
  contractBalance: number,
  _amount: number
}
type props = {
  inputBalance: number;
}

//Material UI
const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
    '& .MuiTextField-root': {
      margin: theme.spacing(1),
      width: 300,
      height: 60,
    },
  },
}));

const { redemptionTokens } = Addresses.StableRedemption.initializeParams;
const stableCoins: StableCoin[] = [
  {
    address: redemptionTokens[0],
    label: 'USDC',
    logo: usdcLogo,
    contractBalance: 0,
    _amount: 0,
  },
  {
    address: redemptionTokens[1],
    label: 'USDT',
    logo: usdtLogo,
    contractBalance: 0,
    _amount: 0,
  },
  {
    address: redemptionTokens[2],
    label: 'DAI',
    logo: daiLogo,
    contractBalance: 0,
    _amount: 0,
  },
  {
    address: redemptionTokens[3],
    label: 'TUSD',
    logo: tusdLogo,
    contractBalance: 0,
    _amount: 0,
  },
];

function MultRedemption(props: props) {

  const classes = useStyles();
  const regexp: RegExp = /^\d*\.?\d*$/;
  //User inputToken balance
  const userInputTokenBalance: number = props.inputBalance;

  //Stable Coins amounts to be received
  const stableCoinLabels: string[] = stableCoins.map((coin) => {
    return coin.label;
  });

  //State for amounts entered by user
  const [stableAmount, setStableAmount] = useState(stableCoinLabels.reduce((current: any, item) =>{
    current[item] = '';
    return current;
  }, {}));

  const handleAmountChange = (event: any): void => {
    const { value, id } = event.target;
    if(value === '' || regexp.test(value)) {
      setStableAmount((prevState: any) => ({
        ...prevState,
        [id]: value
      }));
    }
  }

  const scAmountArr: number[] = Object.values(stableAmount).map((values) => {
    return Number(values);
  });

  //State for balance of tokens in contract
  const [stableContractAmount, setStableContractAmount] = useState(stableCoinLabels.reduce((current: any, item) =>{
    current[item] = '';
    return current;
  }, {}));

  const scContractAmountArr: number[] = Object.values(stableContractAmount).map((values) => {
    return Number(values);
  });

  //Control check for amounts entered by user compared to contract current balance.
  const tokensFlag = (): boolean => {
    let i: number;
    let flag: boolean = false;
    for (i=0; i<scAmountArr.length; i++)  {
      if(scAmountArr[i] > scContractAmountArr[i]) {
        return true;
      }
    }
    return flag;
  }

  //Sum of all the stableCoins amounts entered by the user
  const scTotal: number = scAmountArr.reduce(function(a,b) { return a + b; }, 0);

  //Check the balance of each stablecoin in the contract.
  const checkStableContractBalances = async (): Promise<any> => {
    const { address } = Addresses.StableRedemption;
    stableCoins.map(async (coin) => {
      const balance = await getTokenBalance(coin.address, address);
      const balanceRounded = (Math.round(Number(ethers.utils.formatEther(balance)) * 100) / 100).toFixed(2);
      coin.contractBalance = Number(balanceRounded);
      setStableContractAmount((prevState: any) => ({
        ...prevState,
        [coin.label]: balanceRounded
      }));
    })
  }

  //Function to redeem the inputToken for single or multiple stableCoins
  const redeemStable = async (): Promise<any> => {
    const signer: EthereumSigner = await getSigner();
    const instance: Contract = await getStableRedemptionContract();
    const StableRedemptionSigned: Contract = instance.connect(signer as Signer);

    //Stable Coins Arrays final review & setup
    const stableCoinsFinal: StableCoin[] = stableCoins.map((coin) => {
      coin._amount = Number(stableAmount[coin.label]);
      return coin;
    });

    console.log(stableCoinsFinal);

    const stableToRedeem: StableCoin[] = stableCoinsFinal.filter((coin) => { return coin._amount > 0 });
    const stableAmounts: BigNumber[] = stableToRedeem.map((coin) => {
      const ten: BigNumber = ethers.BigNumber.from(10);
      const coinBigNumber: BigNumber = ethers.BigNumber.from(coin._amount);
      return coinBigNumber.mul(ten.pow(18));
    });
    const stableTokens: Address[] = stableToRedeem.map((coin) => {
      return coin.address;
    });

    if(stableToRedeem.length > 1 && stableAmounts.length > 1) {
      // Amounts calculation
      if(stableTokens.length === stableAmounts.length) {

        StableRedemptionSigned.redeemMulti(stableTokens, stableAmounts);
      }
    } else if(stableToRedeem.length === 1 && stableAmounts.length === 1) {
      const stablecoin: Address = stableToRedeem[0].address;
      const amount: BigNumber = stableAmounts[0];

      StableRedemptionSigned.redeem(stablecoin, amount);
    }

    setOpen(false);
  }

  //Messages & effects
  const [confMessage, setConfMessage] = useState('');
  const [stableTotalMessage, setStableTotalMessage] = useState('');

  useEffect(() => {
    setConfMessage((): string => {
      const stableCoinsAmounts: StableCoin[] = stableCoins.map((coin) => {
        coin._amount = Number(stableAmount[coin.label]);
        return coin;
      });
      const stableToRedeem: StableCoin[] = stableCoinsAmounts.filter((coin) => { return coin._amount > 0 });
      const confMessage = stableToRedeem.map((coin) => {
        const message = ` ${coin.label}: ${coin._amount}`;
        return message;
      })
      return `${scTotal} DORG to  ` + confMessage;
    });

    setStableTotalMessage(() => {
      return `Total: ${scTotal}`;
    })
  }, [scTotal]);

  useEffect(() => {
    checkStableContractBalances();
  }, []);

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
        {userInputTokenBalance >= scTotal
          && tokensFlag() === false ? stableCoins.map(coin => (
          <Fragment key={coin.label + ' key'}>
            <CssBaseline />
            <Container maxWidth="sm" >
              <img src={coin.logo} width="50" height="50" alt=""/>
              <TextField
                id={coin.label}
                label={coin.label + ' token amount'}
                value={stableAmount[coin.label]}
                onChange={handleAmountChange}
                helperText=""
                variant="outlined"
              />
              <Typography variant="overline" title={coin.label + ' balance available in contract'}>{coin.contractBalance}</Typography>
            </Container>
          </Fragment>
        )): stableCoins.map(coin => (
          <Fragment key={coin.label + ' key'}>
            <CssBaseline />
            <Container maxWidth="sm" >
              <img src={coin.logo} width="50" height="50" alt=""/>
              <TextField
                error
                id={coin.label}
                label={coin.label + ' token amount'}
                value={stableAmount[coin.label]}
                onChange={handleAmountChange}
                helperText=""
                variant="outlined"
              />
              <Typography variant="overline" title={coin.label + ' balance available in contract'}>{coin.contractBalance}</Typography>
            </Container>
          </Fragment>
        )) }
      </div>
      <div>
        <Typography>{stableTotalMessage}</Typography>
      </div>
      <div>
        {userInputTokenBalance >= scTotal
         && scTotal > 0
         && tokensFlag() === false ?
          <div>
            <Button variant="contained" color="primary" onClick={handleClickOpen}> Redeem </Button>
            <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description">
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

export default MultRedemption;
