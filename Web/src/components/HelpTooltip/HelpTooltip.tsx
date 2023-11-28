import { TooltipPlacement } from 'antd/lib/tooltip';
import * as React from 'react';
import { connect } from 'react-redux';
import Utils from '../../../core/Utils';
import memoizeOne from '../../libs/memoizeOne';
import { checkExistsHelpFor } from '../HelpIcon/HelpIcon';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./HelpTooltip.module.css');
const sd = require('../antdUseDark.module.css');

interface IHelpTooltipProps {
  paramsProp?: any;

  id?: string;
  hide?: boolean;
  placement?: TooltipPlacement;
}

interface IHelpTooltipState {}

class HelpTooltip extends React.PureComponent<React.PropsWithChildren<IHelpTooltipProps>, IHelpTooltipState> {
  private unNotifHelp: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  memTooltipText = memoizeOne((mode, id) => {
    if (id) {
      let helpRes = checkExistsHelpFor(mode, id, true);
      if (helpRes && !Utils.isNullOrEmpty(helpRes.tooltip)) {
        return helpRes.tooltip;
      } else {
        return null;
      }
    }
  });

  render() {
    let { id, hide, paramsProp } = this.props;

    if (hide) {
      return this.props.children;
    }

    if (!checkExistsHelpFor(paramsProp && paramsProp.get('mode'), id)) {
      return this.props.children;
    }

    let res = this.props.children;

    let textTooltip = this.memTooltipText(paramsProp.get('mode'), id);
    if (textTooltip) {
      res = (
        <TooltipExt title={textTooltip} placement={this.props.placement}>
          <span>{res}</span>
        </TooltipExt>
      );
    }

    return res;
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
  }),
  null,
)(HelpTooltip);
