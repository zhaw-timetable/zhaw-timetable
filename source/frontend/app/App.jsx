import React, { Component, Fragment } from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';

import Hidden from '@material-ui/core/Hidden';

import './App.sass';

import './assets/sass/main.sass';
import './assets/font/font.scss';

import history from './history';

import globalStore from './stores/GlobalStore';

import LoginContainer from './containers/LoginContainer/LoginContainer';
import BottomNavContainer from './containers/BottomNavContainer/BottomNavContainer';
import ScheduleContainer from './containers/ScheduleContainer/ScheduleContainer';
import MensaContainer from './containers/MensaContainer/MensaContainer';
import RoomSearchContainer from './containers/RoomSearchContainer/RoomSearchContainer';
import VsZhawContainer from './containers/VsZhawContainer/VsZhawContainer';
import NotFoundContainer from './containers/NotFoundContainer/NotFoundContainer';
import DrawerContainer from './containers/DrawerContainer/DrawerContainer';

/**
 * Main Component
 * Handles Routing.
 *
 * @class App
 * @extends {Component}
 */
class App extends Component {
  componentWillMount() {
    globalStore.on('current_user_logout', this.handleUserChange);
    globalStore.on('theme_changed', this.handleThemeChanged);
  }

  componentWillUnmount() {
    globalStore.removeListener('current_user_logout', this.handleUserChange);
    globalStore.removeListener('theme_changed', this.handleThemeChanged);
  }

  /**
   * Function that forces reload when user is  updated in Store.
   *
   * @memberof App
   */
  handleUserChange = () => {
    this.forceUpdate();
  };

  /**
   * Function that forces reload when theme is  updated in Store.
   *
   * @memberof App
   */
  handleThemeChanged = () => {
    this.forceUpdate();
  };

  render() {
    /**
     * Secret Route component
     * Users that are not login are forwarded to login.
     * User is login if username is stored in store.
     *
     * @memberof App
     */
    const SecretRoute = ({ component: Component, ...rest }) => (
      <Route
        {...rest}
        render={props =>
          globalStore.currentUser != '' ? (
            <Fragment>
              <DrawerContainer className={globalStore.theme} />
              <div className={'App ' + globalStore.theme}>
                <Component {...props} />
                <Hidden mdUp>
                  <BottomNavContainer />
                </Hidden>
              </div>
            </Fragment>
          ) : window.location.pathname != '/login' ? (
            <Redirect to="/login" />
          ) : (
            <Route exact path="/login" component={LoginContainer} />
          )
        }
      />
    );

    return (
      <Router history={history}>
        <Switch>
          <SecretRoute exact path="/" component={ScheduleContainer} />
          <SecretRoute exact path="/mensa" component={MensaContainer} />
          <SecretRoute exact path="/zhawo" component={RoomSearchContainer} />
          <SecretRoute exact path="/vszhaw" component={VsZhawContainer} />
          <SecretRoute component={NotFoundContainer} />
        </Switch>
      </Router>
    );
  }
}

export default App;
