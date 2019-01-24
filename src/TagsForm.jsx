import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Chip from '@material-ui/core/Chip';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Modal from '@material-ui/core/Modal';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
  },
  input: {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px'
  },
  paper: {
  	display: 'block',
  	position: 'absolute',
    marginTop: '5px',
    width: '400px',
    maxHeight: '200px',
    overflow: 'auto',
    zIndex: 1,
  },
  tagListPaper: {
  	display: 'block',
  	position: 'absolute',
    marginTop: '5px',
    width: 336,
    maxHeight: '200px',
    overflow: 'auto',
    zIndex: 1,
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPaper: {
    width: '400px',
    // height: '300px',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
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

class BookmarkForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      dialogOpen: false,
      tagsInputGetsFocus: false,
    };

    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleTagsMenuItemClick = this.handleTagsMenuItemClick.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
    this.filterTags = this.filterTags.bind(this);
    this.checkDuplicates = this.checkDuplicates.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate() {
  	this.state.tagsInputGetsFocus ? this.tagsInput.focus() : null;
  }

  handleModalClose() {
  	this.props.handleModalClose();
  }

  handleInputChange(event) {
    let bookmarkProps = this.props.bookmarkProps;
    bookmarkProps[event.target.name] = event.target.value;

  	this.props.setFormState(bookmarkProps);
  }

  handleTagsMenuItemClick(selectedItem, event) {
  	let bookmarkProps = this.props.bookmarkProps;

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
	      	bookmarkProps.tags = this.props.bookmarkProps.tags.concat(res);
	      	bookmarkProps.tagsInputValue = '';
			this.props.setFormState(bookmarkProps);
			this.setState({ tagsInputGetsFocus: true });
	      });
  	}

  	if(typeof selectedItem === 'object') {
  		bookmarkProps.tags = this.props.bookmarkProps.tags.concat(selectedItem);
  		bookmarkProps.tagsInputValue = '';
	    this.props.setFormState(bookmarkProps);
	    this.setState({ tagsInputGetsFocus: true });
  	}
  }

  deleteTag(tag) {
	let bookmarkProps = this.props.bookmarkProps;;
	bookmarkProps.tags = bookmarkProps.tags.filter( bookmarkTag => bookmarkTag._id !== tag._id );
	this.props.setFormState(bookmarkProps);
  }

  filterTags() {
  	let input = this.props.bookmarkProps.tagsInputValue;
  	let tags = this.props.tags;
  	let bookmarkProps = this.props.bookmarkProps;

  	if(!input) { return null; }

  	// tags to display that match input value and are not assigned to bookmark
  	let tagsMatchingInput = tags.filter(tag => {
  		let inputMatch = tag.name.toLowerCase().includes(input.toLowerCase());
  		let inUse = this.props.bookmarkProps.tags.find( bookmarkTag => bookmarkTag._id === tag._id);

  		return inputMatch && !inUse;
  	});

  	if(input && tagsMatchingInput.length > 0) {
  		const { classes } = this.props;

  		return (
  			<Paper className={classes.tagListPaper}>
  			{
  			    tagsMatchingInput.map((tag, index) => (
  			      <MenuItem
  			        key={tag._id}
  			        name='tags'
  			        value={tag}
  			        tabIndex={0}
  			        onClick={ event => this.handleTagsMenuItemClick(tag, event) }
  			      >
  			        {tag.name}
  			      </MenuItem>
  			    ))
  			  }
  			</Paper>
  		)
  	}

  	if(input && tagsMatchingInput.length === 0) {
  		const { classes } = this.props;

		return (
			<Paper className={classes.tagListPaper}>
				<MenuItem tabIndex={0} onClick={ event => this.handleTagsMenuItemClick(input) }>{`Create New Tag: ${input}`}</MenuItem>
			</Paper>
		)
  	}

  	return null;
  }

  checkDuplicates(tab) {
    let bookmarks = this.props.bookmarks;

    // check title and url for duplicates against existing bookmarks
    let foundTitle = bookmarks.find( bookmark => bookmark.title.match(new RegExp(`^${tab.title}$`, 'i')) );
    let foundUrl = bookmarks.find( bookmark => bookmark.url.match(new RegExp(`^${tab.url}$`, 'i')) );

    if(foundTitle || foundUrl) { return true; }
  }

  handleSubmit(event) {
    event.preventDefault();

    let tags = this.props.bookmarkProps.tags;

    chrome.tabs.query({ currentWindow: true }, tabs => {

      tabs.forEach( tab => {

        // skipped if bookmark already exists
        if(!this.checkDuplicates(tab)) {
          fetch(`http://bookmark-manager.herokuapp.com/api/bookmarks/create`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                  title: tab.title,
                  url: tab.url,
                  tags: tags,
                  })
          })
            .then( res => res.json() )
            .then( res => { console.log('Created Bookmark from tab: ', res) } )
            .catch( err => console.log('There was an error creating the bookmark: ', err) );
        }

        });

        this.props.handleDrawerClose();
        this.handleModalClose();
        this.setState({ dialogOpen: true, dialogContent: 'Finished saving all tabs on current window.' });
      });
  }

	render() {
		const { classes } = this.props;

		return (
      <React.Fragment>
            <Dialog open={this.state.dialogOpen} onClose={() => this.setState({ dialogOpen: false })}>
              <DialogContent>
                <Typography variant='body2'>
                  {this.state.dialogContent}
                </Typography>
              </DialogContent>
            </Dialog>
      <Modal className={classes.modal} open={this.props.modalOpen} onClose={this.handleModalClose}>

        <Paper className={classes.modalPaper}>


        <form onSubmit={this.handleSubmit}>

        <Input
          autoFocus
          name='tagsInputValue'
          className={classes.input}
          inputRef={input => this.tagsInput = input}
          placeholder='Select tags'
          autoComplete='off'
          value={this.props.bookmarkProps.tagsInputValue}
          onChange={this.handleInputChange}
          onBlur={() => this.setState({ tagsInputGetsFocus: false })}
        />

        {
          // show tag options that match input and are not in use by bookmark
          this.filterTags()
        }

        <div>
          {
            this.props.bookmarkProps.tags ? this.props.bookmarkProps.tags.map( tag => {
            return <Chip
                  name='tags'
                      className={classes.chip}
                      tabIndex={-1}
                      key={tag._id}
                      label={tag.name}
                      onDelete={ () => this.deleteTag(tag) }
                   />
            }) : null
          }
        </div>

        <Button
          className={classes.button}
          variant='contained'
          type='submit'
          color='secondary'
          >
          Submit
        </Button>

          </form>

        </Paper>

      </Modal>
      </React.Fragment>
		)
	}
}

export default withStyles(styles)(BookmarkForm);