import React from 'react'

import BscDapp from '@obsidians/bsc-dapp'

import logo from './logo.svg';
import './App.css';

const message = 'Hello Binance Smart Chain'

export default function App () {
  const dapp = React.useMemo(() => new BscDapp({ extension: 'MetaMask' }), [])
  // const dapp = React.useMemo(() => new BscDapp({ extension: 'BinanceChainWallet' }), [])
  window.dapp = dapp

  const [enabled, setEnabled] = React.useState(dapp.isBrowserExtensionEnabled)
  const [account, setAccount] = React.useState(dapp.currentAddress)
  const [isBscNetwork, setIsBscNetwork] = React.useState()
  const [sig, setSig] = React.useState('')

  React.useEffect(() => dapp.onEnabled(account => {
    setEnabled(true)
    setAccount(account)
    setIsBscNetwork(dapp.network.isBscMainnet)
  }), [])

  React.useEffect(() => dapp.onNetworkChanged(result => {
    setIsBscNetwork(result.isBscMainnet)
  }), [])


  React.useEffect(() => dapp.onAccountChanged(account => {
    setAccount(account)
  }), [])

  const signMessage = async () => {
    let sig
    if (dapp.browserExtension.name === 'MetaMask') {
      // Ref EIP-712, sign data that has a structure
      sig = await dapp.signTypedData([{ type: 'string', name: 'Message', value: message }])
    } else {
      // Binance Chain Wallet doesn't support signTypedData yet
      sig = await dapp.signMessage(message)
    }
    setSig(sig)
  }

  let browserExtensionStatus
  let enableButton = null
  if (dapp.isBrowserExtensionInstalled) {
    browserExtensionStatus = `${dapp.browserExtension.name} Detected. ${enabled ? 'Enabled.' : 'Not enabled'}`
    if (!enabled) {
      enableButton = (
        <button onClick={() => dapp.enableBrowserExtension()}>
          Enable {dapp.browserExtension.name}
        </button>
      )
    }
  } else {
    browserExtensionStatus = 'No Browser Extension detected'
  }

  let accountInfo = null
  if (enabled && account) {
    accountInfo = (
      <div>
        Current account: <small><code>{account.address}</code></small>
        <button onClick={() => getBalanceAndHistory()}>Get Balance and History</button>
      </div>
    )
  }

  const getBalanceAndHistory = async () => {
    const balance = await dapp.rpc.getBalance(account.address)
    console.log('Balance:', balance.toString())

    const txs = await dapp.explorer.getHistory(account.address)
    console.log('TX History:', txs)
  }

  let networkInfo = null
  if (enabled) {
    if (isBscNetwork) {
      networkInfo = <p>Network: BSC Mainnet</p>
    } else {
      networkInfo = <p>Not connected to BSC Mainnet (<a target='_black' href='https://docs.binance.org/smart-chain/wallet/metamask.html'>Use BSC with Metamask</a>)</p>
    }
  }

  let signMessageButton = null
  if (enabled && isBscNetwork) {
    signMessageButton = <div>
      <div>message: <small><code>{message}</code></small></div>
      <div>signature: <small><code>{sig}</code></small></div>
      {!sig && <button onClick={() => signMessage()}>Sign Message</button>}
    </div>
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{browserExtensionStatus}</p>
        {enableButton}
        {accountInfo}
        {networkInfo}
        {signMessageButton}
      </header>
    </div>
  );
}
