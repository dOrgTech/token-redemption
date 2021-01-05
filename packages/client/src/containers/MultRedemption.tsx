import React, { useState, useEffect, Fragment } from 'react';
import { ethers, Contract, BigNumber, Signer } from 'ethers';
import Addresses from '@dorgtech/dorg-token-contracts/artifacts/Addresses.json';
import { Address, EthereumSigner } from '../services/web3';
import { getStableRedemptionContract, getSigner, getTokenBalance } from '../services';
import { Typography, Button, TextField, Dialog, DialogActions, DialogContent,
         DialogContentText, DialogTitle, Container, CssBaseline, makeStyles } from '@material-ui/core/';
import { daiLogo, usdcLogo, tusdLogo, usdtLogo, defaultLogo } from '../assets';

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
let stableCoins: StableCoin[] = [
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

  //Stable Coins labels array
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

  //Sum of all the stableCoins amounts entered by the user
  const scAmountArr: number[] = Object.values(stableAmount).map((values) => {
    return Number(values);
  });
  const scTotal: number = scAmountArr.reduce(function(a,b) { return a + b; }, 0);

  //Add a new StableCoin to the Client
  const [newCoin, setNewCoin] = useState({ address: '', label: '', logo: defaultLogo, contractBalance: 0, _amount: 0 });

  const handleNewCoin = (event: any): void => {
    const { value, id } = event.target;
    setNewCoin((prevState: any) => ({
      ...prevState,
      [id]: value
    }));
  }

  //Function that adds a new Stablecoin to the stableCoins array and pushes it to localStorage
  const addNewCoin = (): void => {
    let i: number = 0;
    for (i=0; i<stableCoins.length; i++) {
      if(stableCoins[i].address === newCoin.address) {
        setConfMessage((): string => {
          return 'Coin is already on the list!';
        });
        setOpenNew(false);
        return undefined;
      }
    }
    stableCoins.push(newCoin);
    window.localStorage.setItem('StableCoins', JSON.stringify(stableCoins));
    setConfMessage((): string => {
      return 'Coin added to the list!';
    });
    setOpenNew(false);
  }

  //Function that checks if there are new Stablecoins in localStorage
  const checkCoins = () => {
    const lsStableCoinsArr: StableCoin[] = JSON.parse((window as any).localStorage.getItem('StableCoins'));
    if(lsStableCoinsArr !== null) {
      stableCoins = lsStableCoinsArr;
    }
  }

  //Function to redeem the inputToken for single or multiple stableCoins
  const redeemStable = async (): Promise<any> => {
    const signer: EthereumSigner = await getSigner();
    const instance: Contract = await getStableRedemptionContract();
    const StableRedemptionSigned: Contract = instance.connect(signer as Signer);

    //Stable Coins Arrays final review & setup
    const stableCoinsFinal: StableCoin[] = stableCoins.map((coin) => {
      coin._amount = stableAmount[coin.label];
      return coin;
    });
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

    setOpenConf(false);
  }

  //Messages & effects
  useEffect(() => {
    checkCoins();
    checkStableContractBalances();
  }, []);

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
  }, [scTotal, stableAmount]);

  //Material UI Dialog
  const [openConf, setOpenConf] = useState(false);
  const [openNew, setOpenNew] = useState(false);

  const handleNewClickOpen = () => {
    setOpenNew(true);
  };

  const handleNewClose = () => {
    setOpenNew(false);
  };

  const handleClickOpen = () => {
    setOpenConf(true);
  };

  const handleClose = () => {
    setOpenConf(false);
  };

  return (
    <form className={classes.root} noValidate autoComplete="off">
      <div>
        {userInputTokenBalance >= scTotal
          && tokensFlag() === false ? stableCoins.map(coin => (
          <Fragment key={coin.label + ' key'} >
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
          <Fragment key={coin.label + ' key'} >
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
        <Container maxWidth="sm" >
        <Button variant="contained" color="primary" onClick={handleNewClickOpen} style={{ float: "right" }} title='Add a new StableCoin'> + </Button>
        </Container>
        <Dialog
        open={openNew}
        onClose={handleNewClose}
        aria-labelledby="new-stableCoin"
        aria-describedby="new-stableCoin-information">
        <DialogTitle id="new-stableCoin">{"New Stablecoin information:"}</DialogTitle>
        <DialogContent>
            <Container maxWidth="sm" >
              {ethers.utils.isAddress(newCoin.address) === false ? (
              <TextField
                error
                id="address"
                label="Enter Stablecoin's address"
                value={newCoin.address}
                onChange={handleNewCoin}
                helperText="Ex. 0x8Ef7c7d047860525B58AFD676EFE90F040c4Beb8"
                variant="outlined"
              />):
              <TextField
                id="address"
                label="Enter Stablecoin's address"
                value={newCoin.address}
                onChange={handleNewCoin}
                helperText="Ex. 0x8Ef7c7d047860525B58AFD676EFE90F040c4Beb8"
                variant="outlined"
              /> }
            </Container>
            <br></br>
            <Container maxWidth="sm" >
              <TextField
                id="label"
                label="Enter Stablecoin's label"
                value={newCoin.label}
                onChange={handleNewCoin}
                helperText="Ex. DAI, USDC, ETH"
                variant="outlined"
              />
            </Container>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewClose} color="primary">
            Cancel
          </Button>
          {ethers.utils.isAddress(newCoin.address) === false ?
          <Button onClick={addNewCoin} color="primary" disabled>
            Add
          </Button> :
          <Button onClick={addNewCoin} color="primary" autoFocus>
            Add
          </Button>}
        </DialogActions>
        </Dialog>
      </div>
      <br></br>
      <br></br>
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
            open={openConf}
            onClose={handleClose}
            aria-labelledby="confirm-Redeem"
            aria-describedby="dialog-to-confirm-your-transaction">
            <DialogTitle id="confirm-redeem">{"Are you sure you want to redeem?"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="dialog-to-confirm-your-transaction">
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
