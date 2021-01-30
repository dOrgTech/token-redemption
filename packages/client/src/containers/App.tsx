import React from 'react';
import './App.css';
import { Home, Metamask } from './';

const RenderMetaMask = () => {
  return (<div className="App">
    <Metamask />
  </div>)
}

const RenderApp = () => {
  return(
    <div className="App">
      <Home />
    </div>
  )
}

function App() {
  if((window as any).ethereum === undefined) {
    return <RenderMetaMask/>
  } else {
    return <RenderApp />
  }
}

export default App;
