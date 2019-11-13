import React, { PureComponent} from 'react'
import PropTypes from 'prop-types'
import Button from '../../components/ui/button'
import UnitInput from '../../components/ui/unit-input'

export default class AddPlugin extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func,
    addPlugin: PropTypes.func,
  }

  state = {
    pluginName: '',
    sourceUrl: ''
  }

  render () {
    return (
      <div className="">
        Plugin Name:
        <input
          value={this.state.pluginName}
          onChange={e => this.setState({ pluginName: e.target.value })}
        />
      
        <div className="account-modal-divider"/>

        Source URL:
        <input
          value={this.state.sourceUrl}
          onChange={e => this.setState({ sourceUrl: e.target.value })}
        />

        <div className="account-modal-divider"/>

        <Button
          type="secondary"
          className="account-modal__button"
          onClick={() => this.props.addPlugin(
            this.state.pluginName,
            this.state.sourceUrl
          )}
        >
          Add Plugin
        </Button>
      </div>
    )
  }
}
