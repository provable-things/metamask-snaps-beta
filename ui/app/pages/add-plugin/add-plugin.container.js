import { connect } from 'react-redux'
import {
  hideModal,
  addPlugin
} from '../../store/actions'
import AddPlugin from './add-plugin.component'

const mapStateToProps = (state) => {
  return {}
}

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    addPlugin: (pluginName, sourceUrl) => dispatch(addPlugin(pluginName, sourceUrl)),
    /*authorizePlugin: (pluginName) => dispatch(authorizePlugin(pluginName)),*/
    /*setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),*/
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddPlugin)