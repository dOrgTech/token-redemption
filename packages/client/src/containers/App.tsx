import React from 'react';
import './App.css';
import { Home, Metamask } from './';

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
        <Home />
      </div>
    );
  }
}

export default App;
