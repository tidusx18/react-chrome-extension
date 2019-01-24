import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Chip from '@material-ui/core/Chip';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
  },
  input: {
    'display': 'block',
    'text-align': 'center',
    'margin-top': '20px'
  },
  paper: {
  	'display': 'block',
  	'position': 'absolute',
    'margin-top': '5px',
    'width': '400px',
    'max-height': '200px',
    'overflow': 'auto',
    'z-index': 1,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '5px',
    margin: '5px',
  },
  chip: {
    margin: theme.spacing.unit / 4,
  },
});

class AddBookmarkForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      tags: [],
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleTagsMenuItemClick = this.handleTagsMenuItemClick.bind(this);
    this.filterTags = this.filterTags.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
  	fetch('http://bookmark-manager.herokuapp.com/api/tags')
  		.then( res => res.json() )
  		.then( res => {
  			this.setState({
	        	tags: this.props.tags ? res.filter( tag => !this.props.tags.reduce( (result, curr) => {
	        		return result + curr._id;
	        	}, res[0]._id).includes(tag._id) ) : [],
	        });
  		});
  }

  handleInputChange(event) {
  	this.props.setModalState(event.target.name, event.target.value);
  }

  handleTagsMenuItemClick(selectedItem) {
  	if(typeof selectedItem === 'string') {
	    fetch('http://bookmark-manager.herokuapp.com/api/tags/create', {
	      method: 'POST',
	      headers: {
	      'Content-Type': 'application/json'
	      },
	      body: JSON.stringify({
	            name: selectedItem
	            })
	    })
	      .then( res => res.json() )
	      .then( res => {
			this.props.setModalState('tags', this.props.tags.concat(res));
			this.setState({ 'tags': this.state.tags.filter( tag => tag._id !== res._id ) })
			this.props.setModalState('tagsInputValue', '');
			this.selectTagsInput.focus();
	      });
  	}

  	if(typeof selectedItem === 'object') {
	    this.props.setModalState('tags', this.props.tags.concat(selectedItem));
	    this.setState({ 'tags': this.state.tags.filter( tag => tag._id !== selectedItem._id ) })
	    this.props.setModalState('tagsInputValue', '');
	    this.selectTagsInput.focus();
  	}
  }

  filterTags() {

  	let input = this.props.tagsInputValue;
  	let filteredTags = this.state.tags.filter(item => {
	    	return !input || item.name.toLowerCase().includes(input.toLowerCase())
	    });

  	if(input && filteredTags.length > 0) {
  		const { classes } = this.props;

		return (
			<Paper className={classes.paper}>
			{
			    filteredTags.map((item, index) => (
			      <MenuItem
			        key={item._id}
			        tabIndex={0}
			        onClick={ event => this.handleTagsMenuItemClick(item) }
			      >
			        {item.name}
			      </MenuItem>
			    ))
			  }
			</Paper>
		)
  	}

  	if(input && filteredTags.length === 0) {
  		const { classes } = this.props;

		return (
			<Paper className={classes.paper}>
				<MenuItem tabIndex={0} onClick={ () => this.handleTagsMenuItemClick(input)}>{`Create New Tag > ${input}`}</MenuItem>
			</Paper>
		)
  	}

  	return null;
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.handleSubmit(this.props);
  }


	render() {
		const { classes } = this.props;

		return (
			<form onSubmit={this.handleSubmit}>
	        <Input
	          autoFocus
	          name='tagsInputValue'
	          className={classes.input}
	          inputRef={input => this.selectTagsInput = input}
	          placeholder='Select tags'
	          autoComplete='off'
	          value={this.props.tagsInputValue}
	          onChange={this.handleInputChange}
	        />
	        {
	        	this.filterTags()
	        }
	        <div>
	          {
	            this.props.tags ? this.props.tags.map( tag => {
	            return <Chip
	                      className={classes.chip}
	                      tabIndex={-1}
	                      key={tag._id}
	                      label={tag.name}
	                      onDelete={ () => {
	                        this.props.setModalState('tags', this.props.tags.filter( item => item._id !== tag._id ));
	                        this.setState({ tags: this.state.tags.concat(tag) });
	                      }}
	                   />
	            }) : null
	          }
	        </div>
	        <Input
	          name='title'
	          className={classes.input}
	          inputProps={{
				placeholder: 'Bookmark Title',
	            autoComplete: 'off',
	            value: this.props.title,
	          }}
	          onChange={this.handleInputChange}
	        />
	        <Input
	          	name='url'
	          	className={classes.input}
	          	inputProps={{
	            	placeholder: 'URL',
	            	autoComplete: 'off',
                	value: this.props.href,
			  	}}
				onChange={this.handleInputChange}
					/>
			<Button
				className={classes.button}
				variant='contained'
				type='submit'
				>
				Submit
			</Button>
				</form>
		)
	}
}

export default withStyles(styles)(AddBookmarkForm);