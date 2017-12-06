import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  FormGroup, 
  FormControl, 
  ControlLabel, 
  Button, 
  Modal, 
  InputGroup,
} from 'react-bootstrap';

import topicViewService from '../../services/topic_view.service';
import topicService from '../../services/topic.service';
import configs from '../../configs';
import Select from 'react-select';
import 'react-select/dist/react-select.min.css';

import Menu from '../utils/menu';
import Language from '../utils/lang_select';
import Flag from '../utils/flag_toggle';

import './topic_view.css';

class Topic extends Component {
  constructor(props) {
    super(props);
    this.state = {
      all_types: configs.types,
      all_categories: [],
      flag: 0,
      id: null,
      
      topic_type: 1,  
      topic_categories: [],  
      topic_title: '',  
      topic_text: '',  
      topic_parents: [],
      error: false,
      success: false,
      delete: false,
      message: {
        title: '',
        text: '',
      }
    }

    this.submitTopic = this.submitTopic.bind(this);
    this.getTopics = this.getTopics.bind(this);
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
  };

  async componentWillMount() {
    const { user, match } = this.props;
    const id = match.params.id;
    if (user) {
      const categories = await topicViewService.getCategories(user.token);
      const editedData = await this.getTopicData(id);

      this.setState({
        all_categories: categories,
        id,
        ...editedData
      });
    } else {
      this.props.history.push('/');
    }
  }

  async getTopicData(id) {
    if (!id) return {};

    const { user, match, history } = this.props;
    const topic = await topicService.getTopic(id);
    const topic_parents = await getParents(topic.parents);
    const topic_categories = await getCategories(topic.categories);
    
    // check if owner 
    if (topic.owner !== user.username) history.push('/');

    return {
      topic_type: topic.type,
      topic_title: topic.title,
      topic_text: topic.body,
      topic_categories,
      topic_parents,
    };

    async function getParents(parents) {
      const formatted = [];

      for (let link of parents) { 
        const id = link.match(/topics\/(\d+)/)[1];
        const topic = await topicService.getTopic(id);
        const { title, url } = topic;
        formatted.push({ label: title, value: title, url });
      }

      return formatted;
    }

    async function getCategories(categories) {
      const formatted = [];

      for (let link of categories) { 
        const id = link.match(/types\/(\d+)/)[1];
        const category = await topicService.getCategory(id);
        const { name, url } = category;
        formatted.push({ label: name, value: name, url });
      }

      return formatted;
    }
  }

  formatData = () => {
    const {
      topic_type,
      topic_categories,
      topic_title,
      topic_text,
      topic_parents,
    } = this.state;

    const formatted = array => array[0] ? array.map(item => item.url) : [];

    return {
      type: topic_type,
      title: topic_title,
      text: topic_text,
      parents: formatted(topic_parents),
      categories: formatted(topic_categories),
    };
  }

  showError = () => {
    this.setState({
      error: true,
      message: {
        title: 'Submit error',
        text: 'Topic title is required.',
      }
    });
  }

  async submitTopic(e) {
    e.preventDefault();
    const { user, match } = this.props;
    const { topic_title } = this.state;
    const edited_id = match.params.id;

    if (!topic_title.trim()) {
      this.showError();
      return;
    }

    const data = this.formatData();
    data.id = edited_id;

    const action = edited_id ? 'updateTopic' : 'createTopic';
    const topic = await topicViewService[action](data, user.token);
    
    if (topic) {
      const { id } = topic;
      const link = configs.server + '/topic/' + id + '/';
      const text = <span>Your topic is available on: <Link to={'/topic/' + id}>{link}</Link></span>;
      
      this.setState({
        success: true,
        message: {
          title: 'Success',
          text
        }
      });
    }
  }

  deleteTopic = async () => {
    const { user, match } = this.props;
    const edited_id = match.params.id;
    const result = await topicViewService.deleteTopic(edited_id, user.token);
    result === 'success' && this.props.history.push('/');
  }
  
  async getTopics(input, callback) {
    const { flag } = this.state;
    const { results } = await topicViewService.search(input, flag);
    const options = results.map(topic => {
      const { title, url } = topic;
      return { label: title, value: title, url }
    });

    callback(null, {
      options: options, 
    });
  }; 

  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  selectCategory = item => {
    item && this.setState({
      topic_categories: item
    });
  }

  selectParents = items => { 
    this.setState({
      topic_parents: items
    });
  }

  showPopUp = state => { 
    this.setState({
      [state]: true
    });
  }

  closeModal = state => {
    this.setState({ 
      [state]: false,
      message: {
        title: '',
        text: '',
      }
    });
    
    state === 'success' && this.props.history.push('/');
  }

  setFlag = key => {
    const { flag } = this.state; 

    flag !== key &&
    this.setState({
      flag: key,
    });
  }
  
  render() {
    const { 
      topic_type, 
      topic_categories, 
      topic_title, 
      topic_text,
      topic_parents,
      
      flag,
      all_categories, 
      all_types,
      message
    } = this.state;
    
    const type = all_types[topic_type - 1].toLowerCase() || "idea";

    const Types = () => all_types.map((item, i) => {
      return <option value={i + 1} key={item}>{item}</option>;
    });
    
    const categories = all_categories.map(item => {
      const { name, url } = item;
      return { value: name, label: name, url }
    });

    const Buttons = () => this.state.id
      ? <div>
          <Button type="submit">Edit</Button>
          <Button className="topic_view__btn" onClick={() => this.showPopUp('delete')}>Delete</Button>
        </div>
      : <Button type="submit">Create</Button>;

    const PopUp = ({ state }) =>
      <div >
        <Modal show={this.state[state]} className="topic_view__modal">
          <Modal.Header>
            <Modal.Title>{message.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {message.text}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.closeModal(state)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>; 

    const DeletePopup = ({ state }) =>
      <div >
        <Modal show={this.state[state]} className="topic_view__modal">
          <Modal.Header>
            <Modal.Title>Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure want to delete this topic?
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.deleteTopic}>Delete</Button>
            <Button onClick={() => this.closeModal(state)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>; 

    return (
      <div className="main">
        <div className="topic_view__container">
          <form onSubmit={this.submitTopic}>
            <FormGroup controlId="formControlsSelect">
              <ControlLabel>Type</ControlLabel>
              <FormControl 
                name="topic_type"
                componentClass="select" 
                value={topic_type} 
                onChange={this.handleChange}>
                <Types />
              </FormControl>
            </FormGroup>
            <FormGroup controlId="formControlsSelect">
              <ControlLabel>Category</ControlLabel> 
              <Select
                className="topic_view__select"
                name="topic_categories"
                clearable={false}
                resetValue={categories[0]}
                multi={true}                
                value={topic_categories}
                options={categories}
                onChange={this.selectCategory}
              />
              </FormGroup>
            <FormGroup>
              <ControlLabel>What's on your mind?</ControlLabel>
              <FormControl
                id="formControlsText"
                className="topic_view__field"
                type="text"
                name="topic_title"
                label="Title"
                value={topic_title}
                onChange={this.handleChange}
                placeholder="Enter title"
              />
              <FormControl
                componentClass="textarea"
                className="comment__text"
                rows="10"
                name="topic_text"
                placeholder={"Enter your " + type}               
                value={topic_text}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup controlId="formControlsSelect">
              <ControlLabel>Parents</ControlLabel>
              <InputGroup>
                <Flag setFlag={this.setFlag} flag={flag} dropup/>
                <Select.Async
                  className="topic_view__select"
                  name="topic_categories"
                  resetValue=''
                  multi={true}
                  value={topic_parents}
                  loadOptions={this.getTopics}
                  onChange={this.selectParents}
                />
              </InputGroup>
            </FormGroup>
            <Buttons />
            </form>
          </div>
        <PopUp state="error"/>
        <PopUp state="success"/>
        <DeletePopup state="delete"/>
        <Language />
        <Menu page='Menu'/>
      </div>
    );
  }
}

export default Topic; 