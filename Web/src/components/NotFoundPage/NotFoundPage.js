/* eslint-disable */
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const title = 'Page Not Found';

class NotFoundPage extends Component {
  static contextTypes = {
    onSetTitle: PropTypes.func.isRequired,
    onPageNotFound: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.context.onSetTitle(title);
    this.context.onPageNotFound();
  }

  render() {
    return (
      <div>
        <h1>{title}</h1>
        <p>Sorry, but the page you were trying to view does not exist.</p>
      </div>
    );
  }
}

export default NotFoundPage;
