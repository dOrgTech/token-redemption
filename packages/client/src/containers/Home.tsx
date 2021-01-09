import React, { useState } from 'react';
import { makeStyles, Typography, Container, Box, Button } from '@material-ui/core/';
import { Main } from './'

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
      padding: '0 30px',
    },
  },
}));

function Home() {

  const classes = useStyles();

  const [flag, setFlag] = useState(false);

  const handleConnectWallet = async () => {
    const web3 = await (window as any).ethereum.enable();
    if(web3 !== undefined) {
      setFlag(true);
    } else {
      setFlag(false);
    }
  }

  if(flag === false) {
    return (
      <Container key="main" className={classes.root}>
        <Box display="flex" justifyContent="center" m={1} p={1}>
          <Typography variant="h4">dOrg Token Redemption</Typography>
        </Box>
        <Box display="flex" justifyContent="center" m={1} p={1}>
          <Button variant="contained" color="primary" title='Connect Wallet' onClick={handleConnectWallet}> Connect Wallet </Button>
        </Box>
      </Container>
    );
  } else {
    return (
      <Main />
    );
  }


}

export default Home;
