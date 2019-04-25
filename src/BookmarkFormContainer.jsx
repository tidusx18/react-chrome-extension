import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import ToolBar from '@material-ui/core/ToolBar';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import CircularProgress from '@material-ui/core/CircularProgress';
import Drawer from '@material-ui/core/Drawer';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/AddCircle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import BookmarkForm from './BookmarkForm.jsx';
import TagsForm from './TagsForm.jsx';

const drawerWidth = 240;

const styles = theme => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appbar: {
    marginBottom: 10,
  },
  flexGrow: {
    flexGrow: 1,
  },
  typographyLink: {
    margin: '0 10px 0 10px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  progress: {
    margin: theme.spacing.unit * 2,
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: drawerWidth,
  },
});

class AddBookmarkContainer extends React.Component {

  constructor(props) {
  	super(props);

    this.state = {
      tags: [],
      bookmarks: [],
      modalOpen: false,
      drawerOpen: false,
      dialogOpen: false,
      dialogContent: '',
      bookmarkProps: {
        id: '',
        title: '',
        url: '',
        tags: [],
        tagsInputValue: '',
      }
    };

    this.handleModaltoggle = this.handleModaltoggle.bind(this);
    this.handleDrawerToggle = this.handleDrawerToggle.bind(this);
    this.setFormState = this.setFormState.bind(this);
    this.removeBookmark = this.removeBookmark.bind(this);
    this.refreshBookmarks = this.refreshBookmarks.bind(this);
  }


  componentDidMount() {
    Promise.all([
      fetch('http://bookmark-manager.herokuapp.com/api/tags').then( res => res.json() ),
      fetch('http://bookmark-manager.herokuapp.com/api/bookmarks').then( res => res.json() )
    ]).then( (res) => {
      this.setState({ tags: res[0], bookmarks: res[1] })
    })
    .catch( err => console.log('There was an error fetching tags/bookmarks: ', err) )

    chrome.tabs.query({ currentWindow: true, active: true }, res => {

      fetch(`https://bookmark-manager.herokuapp.com/api/bookmarks/find?prop=url&value=${res[0].url}`)
        .then( response => response.json() )
        .then( response => {

          let bookmarkProps = this.state.bookmarkProps;

          // bookmark exists - populate form with existing bookmark info
          if(response[0]) {

            bookmarkProps.id = response[0]._id;
            bookmarkProps.title = response[0].title;
            bookmarkProps.url = response[0].url;
            bookmarkProps.tags = response[0].tags;

            this.setFormState(bookmarkProps);

            return null;
          }

          // bookmark doesn't exist - populate form with current tab's title and URL
          bookmarkProps.title = res[0].title;
          bookmarkProps.url = res[0].url;

          this.setFormState(bookmarkProps);
        });
    });
  }

  handleModaltoggle() {
    this.setState({ modalOpen: !(this.state.modalOpen) });
  }

  handleDrawerToggle() {
    this.setState({ drawerOpen: !(this.state.drawerOpen) });
  }

  refreshBookmarks() {
    console.log('refresh bookmarks')
    fetch('http://bookmark-manager.herokuapp.com/api/bookmarks')
      .then( res => res.json() )
      .then( res => this.setState({ bookmarks: res }) )
      .catch( err => console.log('Error fetching bookmarks: ', err) );
  }

  removeBookmark(id) {
    fetch(`http://bookmark-manager.herokuapp.com/api/bookmarks/${id}/delete`, {
      method: 'DELETE'
    })
      .then( res => res.json() )
      .then( res => {
        this.refreshBookmarks();
        this.setState({ dialogOpen: true, dialogContent: 'Bookmark deleted.' });
      })
      .catch( err => console.log('There was an error deleting the bookmark: ', err) );

    chrome.browserAction.setIcon({ path: 'images/get_started16.png' });
  }

  setFormState(value) {
    this.setState({ bookmarkProps: value });
  }

  render() {
    const { classes } = this.props;
    const bookmarkProps = this.state.bookmarkProps;

    // wait for bookmarks to be assigned in state
    if(this.state.bookmarks.length === 0) { return <div className={classes.container}> <CircularProgress /> </div>; }

    const drawer = (
      <div>
        <Divider />

        <List>

          <ListItem button onClick={this.handleModaltoggle}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary='Save All Tabs' />
          </ListItem>

        </List>

        <Divider />
      </div>
    );

    return (

      <React.Fragment>

        <AppBar className={classes.appbar} position='relative' color='secondary'>
          <ToolBar>

            <IconButton color='inherit' onClick={this.handleDrawerToggle}>
              <MenuIcon />
            </IconButton>

            <Typography
              className={classes.flexGrow}
              variant='h6'
              color='inherit'>
              {bookmarkProps.id ? 'Update' : 'Save New'} Bookmark
            </Typography>

            {
              bookmarkProps.id ?

              <IconButton disableRipple color='inherit'>
                <DeleteIcon onClick={ () => { this.removeBookmark(bookmarkProps.id) } } />
              </IconButton>

              : null
            }

          </ToolBar>
        </AppBar>

        <Drawer
          variant='temporary'
          anchor='left'
          open={this.state.drawerOpen}
          onClose={this.handleDrawerToggle}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </Drawer>

        <Dialog open={this.state.dialogOpen} onClose={() => this.setState({ dialogOpen: false })}>
          <DialogContent>
            <Typography variant='body2'>
              {this.state.dialogContent}
            </Typography>
          </DialogContent>
        </Dialog>

        <BookmarkForm
          tags={this.state.tags}
          bookmarks={this.state.bookmarks}
          bookmarkProps={this.state.bookmarkProps}
          setFormState={this.setFormState}
        />

        <TagsForm
          modalOpen={this.state.modalOpen}
          handleModalClose={this.handleModaltoggle}
          handleDrawerClose={this.handleDrawerToggle}
          tags={this.state.tags}
          bookmarks={this.state.bookmarks}
          checkedBookmarks={this.state.checkedBookmarks}
          bookmarkProps={this.state.bookmarkProps}
          setFormState={this.setFormState}
        />

      </React.Fragment>

    )
  }
}

export default withStyles(styles)(AddBookmarkContainer);