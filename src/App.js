import React, { Component } from 'react'
import './App.css'
import Nav from './views/nav'
const DepGraph = require('./graphs/DepGraph')

const bundles = {
  'js-tendermint': require('./data/deps.json'),
}
const bundleNames = Object.keys(bundles)

const routes = ['packages', 'modules']

class App extends Component {

  constructor() {
    super()
    this.state = {
      mode: routes[0],
      bundle: 'js-tendermint',
    }
  }

  selectMode (target) {
    this.setState(state => ({ mode: target }))
  }

  selectBundle (target) {
    this.setState(state => ({ bundle: target }))
  }

  render () {
    const bundleData = bundles[this.state.bundle]
    return (
      <div className="App">
        <Nav
          routes={bundleNames}
          activeRoute={this.state.bundle}
          onNavigate={(target) => this.selectBundle(target)}
          />
        <Nav
          routes={routes}
          activeRoute={this.state.mode}
          onNavigate={(target) => this.selectMode(target)}
          />
        <DepGraph
          bundleData={bundleData}
          mode={this.state.mode}
          /> 
      </div>
    )
  }
}

export default App
