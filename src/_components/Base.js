import React from 'react';

class Base extends React.Component {

  constructor(props) {
    super(props);
    this.setStateAsync = this.setStateAsync.bind(this);
  }


  /**
   * allows for "await" kw when state is being set to avoid
   * unreadable callback code
   *
   * @param state
   * @returns {Promise<any>}
   */
  setStateAsync(state) {
    return new Promise(resolve => this.setState(state, resolve));
  };

}

export {Base};