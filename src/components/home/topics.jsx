import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import store_home from '../../store/home'; 

class Topics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topics: props.topics
    }
  }

  static propTypes = {
    topics: PropTypes.array.isRequired
  };

  componentWillReceiveProps(nextProps) {
    if (this.state.topics !== nextProps.topics){
      this.setState({
        topics: nextProps.topics
      });
    }
  }
 
  saveScroll() {
    store_home.home_scroll = window.scrollY; 
  }

  render() {

    const List = () =>
      this.state.topics.map(topic => (
        <section className="topics__item" key={topic.id}>
          <Link to={'/topic/' + topic.id} onClick={this.saveScroll} className="topics__item-title" data-id={topic.id}>
            <h2>{topic.title}</h2>
          </Link>
        </section>
      ));

    return (
      <div className="topics__list">
        <List />
      </div>
    );
  }
}

export default Topics;
