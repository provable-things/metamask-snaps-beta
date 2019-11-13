const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-tracker')
const TokenCell = require('./token-cell.js')
const connect = require('react-redux').connect
const selectors = require('../../selectors/selectors')
const log = require('loglevel')
const { compose } = require('recompose')
const { withRouter } = require('react-router-dom')
const { PLUGIN_ROUTE } = require('../../helpers/constants/routes')
const { hideSidebar } = require('../../store/actions')

function mapStateToProps (state) {
  const ethTokens = state.metamask.tokens
  const pluginTokens = state.metamask.assets

  return {
    network: state.metamask.network,
    tokens: ethTokens,
    pluginTokens,
    userAddress: selectors.getSelectedAddress(state),
    assetImages: state.metamask.assetImages,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideSidebar: () => dispatch(hideSidebar())
  }
}

const defaultTokens = []
const contracts = require('eth-contract-metadata')
for (const address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    defaultTokens.push(contract)
  }
}

TokenList.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TokenList)


inherits(TokenList, Component)
function TokenList () {
  this.state = {
    tokens: [],
    isLoading: true,
    network: null,
  }
  Component.call(this)
}

TokenList.prototype.render = function () {
  const { userAddress, pluginTokens, assetImages } = this.props
  const state = this.state
  const { tokens, isLoading, error } = state
  if (isLoading) {
    return this.message(this.context.t('loadingTokens'))
  }

  if (error) {
    log.error(error)
    return h('.hotFix', {
      style: {
        padding: '80px',
      },
    }, [
      this.context.t('troubleTokenBalances'),
      h('span.hotFix', {
        style: {
          color: 'rgba(247, 134, 28, 1)',
          cursor: 'pointer',
        },
        onClick: () => {
          global.platform.openWindow({
            url: `https://ethplorer.io/address/${userAddress}`,
          })
        },
      }, this.context.t('here')),
    ])
  }

  pluginTokens.forEach((pluginToken) => {
    // TODO: Proper decimal encoding:
    pluginToken.string = pluginToken.balance
  })
  return h('div', tokens.concat(pluginTokens).map((tokenData) => {
    tokenData.image = assetImages[tokenData.address]
    if (tokenData.customViewUrl && !tokenData.inMetamask) {
      tokenData.onClick = this.showPluginTokenInsideBrowser.bind(this, tokenData)
    }
    if (tokenData.customViewUrl && tokenData.inMetamask === true) {
      tokenData.onClick = this.showPluginTokenInsideMetamask.bind(this, tokenData)
    }
    return h(TokenCell, tokenData)
  }))

}

TokenList.prototype.showPluginTokenInsideBrowser = function (tokenData) {
  const url = tokenData.customViewUrl
  global.platform.openWindow({ url })
}

TokenList.prototype.showPluginTokenInsideMetamask = function (tokenData) {
  const url = tokenData.customViewUrl
  const {
    history,
  } = this.props

  history.push({
    pathname: PLUGIN_ROUTE,
    state: { url }
  })
  this.props.hideSidebar()
}

TokenList.prototype.message = function (body) {
  return h('div', {
    style: {
      display: 'flex',
      height: '250px',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
    },
  }, body)
}

TokenList.prototype.componentDidMount = function () {
  this.createFreshTokenTracker()
}

TokenList.prototype.createFreshTokenTracker = function () {
  if (this.tracker) {
    // Clean up old trackers when refreshing:
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

  if (!global.ethereumProvider) return
  const { userAddress } = this.props

  this.tracker = new TokenTracker({
    userAddress,
    provider: global.ethereumProvider,
    tokens: this.props.tokens,
    pollingInterval: 8000,
  })


  // Set up listener instances for cleaning up
  this.balanceUpdater = this.updateBalances.bind(this)
  this.showError = (error) => {
    this.setState({ error, isLoading: false })
  }
  this.tracker.on('update', this.balanceUpdater)
  this.tracker.on('error', this.showError)

  this.tracker.updateBalances()
    .then(() => {
      this.updateBalances(this.tracker.serialize())
    })
    .catch((reason) => {
      log.error(`Problem updating balances`, reason)
      this.setState({ isLoading: false })
    })
}

TokenList.prototype.componentDidUpdate = function (prevProps) {
  const {
    network: oldNet,
    userAddress: oldAddress,
    tokens,
  } = prevProps
  const {
    network: newNet,
    userAddress: newAddress,
    tokens: newTokens,
  } = this.props

  const isLoading = newNet === 'loading'
  const missingInfo = !oldNet || !newNet || !oldAddress || !newAddress
  const sameUserAndNetwork = oldAddress === newAddress && oldNet === newNet
  const shouldUpdateTokens = isLoading || missingInfo || sameUserAndNetwork

  const oldTokensLength = tokens ? tokens.length : 0
  const tokensLengthUnchanged = oldTokensLength === newTokens.length

  if (tokensLengthUnchanged && shouldUpdateTokens) return

  this.setState({ isLoading: true })
  this.createFreshTokenTracker()
}

TokenList.prototype.updateBalances = function (tokens) {
  if (!this.tracker.running) {
    return
  }
  this.setState({ tokens, isLoading: false })
}

TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
  this.tracker.removeListener('update', this.balanceUpdater)
  this.tracker.removeListener('error', this.showError)
}

// function uniqueMergeTokens (tokensA, tokensB = []) {
//   const uniqueAddresses = []
//   const result = []
//   tokensA.concat(tokensB).forEach((token) => {
//     const normal = normalizeAddress(token.address)
//     if (!uniqueAddresses.includes(normal)) {
//       uniqueAddresses.push(normal)
//       result.push(token)
//     }
//   })
//   return result
// }
//
