import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";
import ipfs from './ipfs'

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ipfsHash: '',
      // storageValue: 0, 
      web3: null,
      buffer: null,
      account: null
      // accounts: null,
      // contract: null
    }
    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }
  // state = { 
  //   storageValue: 0, 
  //   web3: null, 
  //   accounts: null, 
  //   contract: null 
  // };

  componentWillMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      this.setState({ web3, accounts, contract: instance }, this.instantiateContract);
    } catch (error) {
      
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  // componentWillMount() {
  //   // Get network provider and web3 instance.
  //   // See utils/getWeb3 for more info.

  //   getWeb3().then(results => {
  //     this.setState({
  //       web3: results.web3
  //     })

  //     // Instantiate contract once web3 provided.
  //     this.instantiateContract()
  //   })
  //   .catch(() => {
  //     console.log('Error finding web3.')
  //   })
  // }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(this.state.web3.currentProvider)

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      simpleStorage.deployed().then((instance) => {
        this.simpleStorageInstance = instance
        this.setState({ account: accounts[0] })
        // Get the value from the contract to prove it worked.
        // return this.simpleStorageInstance.get.call(accounts[0])
        return this.simpleStorageInstance.get()
      }).then((ipfsHash) => {
        // Update state with the result.
        console.log(ipfsHash)
        return this.setState({ ipfsHash })
      })
      .catch(()=> {
        console.log('Error in fetching')
      })
    })
  }

  // componentDidMount = async () => {
  //   try {
  //     // Get network provider and web3 instance.
  //     const web3 = await getWeb3();

  //     // Use web3 to get the user's accounts.
  //     const accounts = await web3.eth.getAccounts();

  //     // Get the contract instance.
  //     const networkId = await web3.eth.net.getId();
  //     const deployedNetwork = SimpleStorageContract.networks[networkId];
  //     const instance = new web3.eth.Contract(
  //       SimpleStorageContract.abi,
  //       deployedNetwork && deployedNetwork.address,
  //     );

  //     // Set web3, accounts, and contract to the state, and then proceed with an
  //     // example of interacting with the contract's methods.
  //     this.setState({ web3, accounts, contract: instance }, this.runExample);
  //   } catch (error) {
  //     // Catch any errors for any of the above operations.
  //     alert(
  //       `Failed to load web3, accounts, or contract. Check console for details.`,
  //     );
  //     console.error(error);
  //   }
  // };

  // runExample = async () => {
  //   const { accounts, contract } = this.state;

  //   // Stores a given value, 5 by default.
  //   await contract.methods.set(5).send({ from: accounts[0] });

  //   // Get the value from the contract to prove it worked.
  //   const response = await contract.methods.get().call();

  //   // Update state with the result.
  //   this.setState({ storageValue: response });
  // };

  captureFile(event) {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  onSubmit(event) {
    event.preventDefault()
    ipfs.files.add(this.state.buffer, (error, result) => {
      if(error) {
        console.error(error)
        return
      }
      this.simpleStorageInstance.set(result[0].hash, { from: this.state.account }).then((r) => {
        this.setState({ ipfsHash: result[0].hash })
        console.log('ifpsHash', this.state.ipfsHash)
      })
    })
    // event.preventDefault()
    // ipfs.files.add(this.state.buffer, (error, result) => {
    //   if(error) {
    //     console.error(error)
    //     return
    //   }
    //   this.setState({ ipfsHash: result[0].hash })
    //   console.log('ifpsHash', this.state.ipfsHash)
    //   // this.simpleStorageInstance.set(result[0].hash, { from: this.state.account }).then((r) => {
    //   //   return this.setState({ ipfsHash: result[0].hash })
    //   //   console.log('ifpsHash', this.state.ipfsHash)
    //   // })
    // })
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <a href="#">IPFS File Upload DApp</a>
        <h1>Your Image</h1>
        <p>This image is stored on IPFS and The Ethereum Blockchain!</p>
        <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt=""/>
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit}>
          <input type='file'onChange={this.captureFile} />
          <input type='submit' />
        </form>
        {/* <p>
          If your contracts compiled and migrated successfully, below will show
          a stored value of 5 (by default).
        </p>
        <p>
          Try changing the value stored on <strong>line 42</strong> of App.js.
        </p>
        <div>The stored value is: {this.state.storageValue}</div> */}
      </div>
    );
  }
}

export default App;
