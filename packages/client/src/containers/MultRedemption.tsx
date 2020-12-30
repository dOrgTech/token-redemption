import React, { useState, useEffect, Fragment } from 'react';
import { ethers, Contract, BigNumber, Signer } from 'ethers';
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Address, EthereumSigner } from '../services/web3';
import { getStableRedemptionContract,
         getSigner,
         getUsdcTokenBalance,
         getUsdtTokenBalance,
         getDaiTokenBalance,
         getTusdTokenBalance } from '../services';
import { Typography, Button, TextField, Dialog, DialogActions, DialogContent,
         DialogContentText, DialogTitle, Container, CssBaseline, makeStyles } from '@material-ui/core/';
import { daiLogo, usdcLogo, tusdLogo, usdtLogo } from '../assets';


//types
type StableCoin = {
  value: Address,
  label: string
}
type props = {
  inputBalance: number;
}
type StableToRedeem = {
  name: string,
  amount: number,
  address: Address
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
      width: 300,
      height: 60,
    },
  },
}));

function MultRedemption(props: props) {

  const classes = useStyles();
  const regexp: RegExp = /^\d*\.?\d*$/;
  //User inputToken balance
  const userInputTokenBalance: number = props.inputBalance;

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
  const stableCoinsTotal: number = stableCoinArr.reduce(function(a,b) { return a + b; }, 0);

  // Stablecoin Balances in contract
  const [stableContractBalances, setStableContractBalances] = useState({ usdcBalance: '', usdtBalance: '', daiBalance: '', tusdBalance: '' });

  //Check the balance of each stablecoin in the contract.
  const checkStableContractBalances = async (): Promise<any> => {
    const usdcBalance: number = await getUsdcTokenBalance();
    const usdcRounded = (Math.round(Number(ethers.utils.formatEther(usdcBalance)) * 100) / 100).toFixed(2);

    const usdtBalance: number = await getUsdtTokenBalance();
    const usdtRounded = (Math.round(Number(ethers.utils.formatEther(usdtBalance)) * 100) / 100).toFixed(2);

    const daiBalance: number = await getDaiTokenBalance();
    const daiRounded = (Math.round(Number(ethers.utils.formatEther(daiBalance)) * 100) / 100).toFixed(2);

    const tusdBalance: number = await getTusdTokenBalance();
    const tusdRounded = (Math.round(Number(ethers.utils.formatEther(tusdBalance)) * 100) / 100).toFixed(2);

    setStableContractBalances(
      {
        usdcBalance: usdcRounded,
        usdtBalance: usdtRounded,
        daiBalance: daiRounded,
        tusdBalance: tusdRounded
      }
    );
  }

  //Function to redeem the inputToken for single or multiple stableCoins
  const redeemStable = async (): Promise<any> => {
    const signer: EthereumSigner = await getSigner();
    const instance: Contract = await getStableRedemptionContract();
    const StableRedemptionSigned: Contract = instance.connect(signer as Signer);

    //Token addresses
    const stableTokenAddresses: Address[] = stablecoins.map((coin) => {
      return coin.value;
    });

    const stableTokensConfig: StableToRedeem[] =
      [
        {
          name: "USDC",
          amount: stableCoinArr[0],
          address: stableTokenAddresses[0]
        },
        {
          name: "USDT",
          amount: stableCoinArr[1],
          address: stableTokenAddresses[1]
        },
        {
          name: "DAI",
          amount: stableCoinArr[2],
          address: stableTokenAddresses[2]
        },
        {
          name: "TUSD",
          amount: stableCoinArr[3],
          address: stableTokenAddresses[3]
        }
      ];

    const stableToRedeem: StableToRedeem[] = stableTokensConfig.filter((coin) => { return coin.amount > 0 });
    const stableAmounts: BigNumber[] = stableToRedeem.map((coin) => {
      const ten: BigNumber = ethers.BigNumber.from(10);
      const coinBigNumber: BigNumber = ethers.BigNumber.from(coin.amount);
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
    setConfMessage((): any => {
      return `DORG to USDC: ${stableUSDC}, USDT: ${stableUSDT}, DAI: ${stableDAI}, TUSD: ${stableTUSD}`;
    });

    setStableTotalMessage(() => {
      return `Total: ${stableCoinsTotal}`;
    })
  }, [stableCoinsTotal, stableUSDC, stableUSDT, stableDAI, stableTUSD]);

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
        <br></br>
        {userInputTokenBalance >= stableCoinsTotal
         && stableUSDC <= Number(stableContractBalances.usdcBalance)
         && stableUSDT <= Number(stableContractBalances.usdtBalance)
         && stableDAI <= Number(stableContractBalances.daiBalance)
         && stableTUSD <= Number(stableContractBalances.tusdBalance) ?
        <div>
          <Fragment>
            <CssBaseline />
            <Container maxWidth="sm" >
              <img src={usdcLogo} width="50" height="50" alt=""/>
              <TextField
                id="outlined-select-usdctokenamount"
                label="USDC token amount"
                value={stableUSDC}
                onChange={handleUSDC}
                helperText=""
                variant="outlined"
              />
              <Typography variant="overline" title="USDC balance available in contract">{stableContractBalances.usdcBalance}</Typography>
            </Container>
          </Fragment>
          <Fragment>
            <CssBaseline />
            <Container maxWidth="sm">
              <img src={usdtLogo} width="50" height="50" alt=""/>
              <TextField
                id="outlined-select-usdttokenamount"
                label="USDT token amount"
                value={stableUSDT}
                onChange={handleUSDT}
                helperText=""
                variant="outlined"
              />
              <Typography variant="overline" title="USDT balance available in contract">{stableContractBalances.usdtBalance}</Typography>
            </Container>
          </Fragment>
          <Fragment>
            <CssBaseline />
            <Container maxWidth="sm">
              <img src={daiLogo} width="50" height="50" alt=""/>
              <TextField
                id="outlined-select-daitokenamount"
                label="DAI token amount"
                value={stableDAI}
                onChange={handleDAI}
                helperText=""
                variant="outlined"
              />
              <Typography variant="overline" title="DAI balance available in contract">{stableContractBalances.daiBalance}</Typography>
            </Container>
          </Fragment>
          <Fragment>
            <CssBaseline />
            <Container maxWidth="sm">
              <img src={tusdLogo} width="50" height="50" alt=""/>
              <TextField
                id="outlined-select-tusdtokenamount"
                label="TUSD token amount"
                value={stableTUSD}
                onChange={handleTUSD}
                helperText=""
                variant="outlined"
              />
              <Typography variant="overline" title="TUSD balance available in contract">{stableContractBalances.tusdBalance}</Typography>
            </Container>
          </Fragment>
          <Typography>{stableTotalMessage}</Typography>
        </div> :
        <div>
        <Fragment>
          <CssBaseline />
          <Container maxWidth="sm" >
            <img src={usdcLogo} width="50" height="50" alt=""/>
            <TextField
              error
              id="outlined-error-usdctokenamount"
              label="USDC token amount"
              value={stableUSDC}
              onChange={handleUSDC}
              helperText=""
              variant="outlined"
            />
            <Typography variant="overline" title="USDC balance available in contract">{stableContractBalances.usdcBalance}</Typography>
          </Container>
        </Fragment>
        <Fragment>
          <CssBaseline />
          <Container maxWidth="sm">
            <img src={usdtLogo} width="50" height="50" alt=""/>
            <TextField
              error
              id="outlined-error-usdttokenamount"
              label="USDT token amount"
              value={stableUSDT}
              onChange={handleUSDT}
              helperText=""
              variant="outlined"
            />
            <Typography variant="overline" title="USDT balance available in contract">{stableContractBalances.usdtBalance}</Typography>
          </Container>
        </Fragment>
        <Fragment>
          <CssBaseline />
          <Container maxWidth="sm">
            <img src={daiLogo} width="50" height="50" alt=""/>
            <TextField
              error
              id="outlined-error-daitokenamount"
              label="DAI token amount"
              value={stableDAI}
              onChange={handleDAI}
              helperText=""
              variant="outlined"
            />
            <Typography variant="overline" title="DAI balance available in contract">{stableContractBalances.daiBalance}</Typography>
          </Container>
        </Fragment>
        <Fragment>
          <CssBaseline />
          <Container maxWidth="sm">
            <img src={tusdLogo} width="50" height="50" alt=""/>
            <TextField
              error
              id="outlined-error-tusdtokenamount"
              label="TUSD token amount"
              value={stableTUSD}
              onChange={handleTUSD}
              helperText=""
              variant="outlined"
            />
            <Typography variant="overline" title="TUSD balance available in contract">{stableContractBalances.tusdBalance}</Typography>
          </Container>
        </Fragment>
          <Typography color="secondary">Inssuficient tokens!</Typography>
        </div>
       }
      </div>
      <div>
        {userInputTokenBalance >= stableCoinsTotal && stableCoinsTotal > 0 ?
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

export default MultRedemption;
