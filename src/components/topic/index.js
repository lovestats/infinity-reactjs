import { connect } from 'react-redux';
import Topic from './topic';

function mapStateToProps(state) {
  return {
    user: state
  }
}

export default connect(mapStateToProps, null)(Topic);
