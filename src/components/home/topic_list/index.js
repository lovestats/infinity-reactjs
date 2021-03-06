import { connect } from 'react-redux';
import TopicList from './topic_list';

function mapStateToProps(state) {
  return {
    user: state
  }
}

export default connect(mapStateToProps, null)(TopicList);
