import { connect } from 'react-redux'
import Plugin from './plugin.component'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'

const mapStateToProps = ({ metamask }) => {
  return {}
}

const mapDispatchToProps = dispatch => {
  return {}
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Plugin)