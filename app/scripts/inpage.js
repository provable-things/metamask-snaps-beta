
// TODO:plugins:launch remove this
console.warn('MetaMask: You are using the experimental plugin version of MetaMask.')

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.')
  }
}

cleanContextForImports()
const log = require('loglevel')
const LocalMessageDuplexStream = require('post-message-stream')
const MetamaskInpageProvider = require('metamask-inpage-provider')

let warned = false

restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
const metamaskStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})

// compose the inpage provider
const inpageProvider = new MetamaskInpageProvider(metamaskStream)

// set a high max listener count to avoid unnecesary warnings
inpageProvider.setMaxListeners(100)

// TODO:synchronous re-implement: { networkVersion, selectedAddress } = window.ethereum
// publicConfig isn't populated until we get a message from background.
// Using this getter will ensure the state is available
const getPublicConfigWhenReady = async () => {
  const store = inpageProvider.publicConfigStore
  let state = store.getState()
  // if state is missing, wait for first update
  if (!state.hasOwnProperty('isUnlocked')) {
    state = await new Promise(resolve => store.once('update', resolve))
    console.log('new state', state)
  }
  return state
}

// add metamask-specific convenience methods
inpageProvider._metamask = new Proxy({
  /**
   * Determines if MetaMask is unlocked by the user
   *
   * @returns {Promise<boolean>} - Promise resolving to true if MetaMask is currently unlocked
   */
  isUnlocked: async function () {
    const { isUnlocked } = await getPublicConfigWhenReady()
    return Boolean(isUnlocked)
  },
}, {
  get: function (obj, prop) {
    !warned && console.warn('Heads up! ethereum._metamask exposes methods that have ' +
    'not been standardized yet. This means that these methods may not be implemented ' +
    'in other dapp browsers and may be removed from MetaMask in the future.')
    warned = true
    return obj[prop]
  },
})

// Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
// `sendAsync` method on the prototype, causing `this` reference issues
const proxiedInpageProvider = new Proxy(inpageProvider, {
  // straight up lie that we deleted the property so that it doesnt
  // throw an error in strict mode
  deleteProperty: () => true,
  // TODO:temp
  isPermissionsBeta: () => true,
})

window.ethereum = proxiedInpageProvider
