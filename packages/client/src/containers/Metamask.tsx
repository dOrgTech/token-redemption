import React from 'react';
import { makeStyles, Typography, Container, Box, Button } from '@material-ui/core/';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
      padding: '0 30px',
    },
  },
}));

function Metamask() {

  const classes = useStyles();

  return (
    <Container key="main" className={classes.root}>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Typography variant="h5">dOrg Token Redemption</Typography>
      </Box>
      <br></br>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Typography variant="subtitle1">Please install Metamask to use this dApp!</Typography>
      </Box>
      <Box display="flex" justifyContent="center" m={1} p={1}>
        <Button variant="contained" target="blank" href="https://metamask.io/download.html" color="primary" title='Install Metamask'> Install Metamask </Button>
      </Box>

    </Container>
  );
}

export default Metamask;
