import React from 'react';
import './App.css';
import { Main, Metamask } from './';

function App() {

if((window as any).web3 === undefined) {
  return (
    <div className="App">
      <Metamask />
    </div>
  );
} else {
    return (
      <div className="App">
        <Main />
      </div>
    );
  }
}

export default App;
