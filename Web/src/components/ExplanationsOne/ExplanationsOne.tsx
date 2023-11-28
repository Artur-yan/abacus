import * as React from 'react';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./ExplanationsOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IExplanationsOneProps {}

interface IExplanationsOneState {}

class ExplanationsOne extends React.PureComponent<IExplanationsOneProps, IExplanationsOneState> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return <RefreshAndProgress msgMsg={'Coming soon to beta. Check back in a few days'}></RefreshAndProgress>;
  }
}

export default ExplanationsOne;
