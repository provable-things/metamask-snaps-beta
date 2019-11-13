import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class Plugin extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    location: PropTypes.object
  }

  state = {
    url: null
  }

  componentWillMount () {
    const { location } = this.props
    this.setState({ url: location.state.url})
  }

  render () {
    return (
      <iframe src={this.state.url}></iframe>
    )
  }
}

export default Plugin