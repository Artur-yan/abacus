import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import REActions from '../../actions/REActions';
import StoreActions from '../../stores/actions/StoreActions';
import PartsLink from '../NavLeft/PartsLink';
import TooltipExt from '../TooltipExt/TooltipExt';
import { memProjectById } from '../../stores/reducers/projects';
const s = require('./HelpIcon.module.css');
const sd = require('../antdUseDark.module.css');
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';

interface IHelpIconProps {
  paramsProp?: any;
  projects?: any;
  useCases?: any;

  id?: string;
  tooltipText?: string;
  text?: string;
  hide?: boolean;
  isModal?: boolean;
  style?: CSSProperties;
  tooltipOnlyIfNonId?: boolean;
}

interface IHelpIconState {
  selected?: boolean;
}

let helpDictPartAndId = null;
let prepareDictCheck = () => {
  if (StoreActions.helptext == null) {
    return;
  }

  if (helpDictPartAndId == null) {
    helpDictPartAndId = {};

    let helptext1 = StoreActions.helptext;
    let kk = Object.keys(helptext1 ?? {});
    kk.some((partKey) => {
      let helpPart = helptext1[partKey];
      if (helpPart) {
        let kk2 = Object.keys(helpPart);
        kk2.some((id1) => {
          let key1 = partKey + '___' + id1;
          helpDictPartAndId[key1] = helpPart[id1];
        });
      }
    });
  }
};

export const checkExistsHelpFor = (partLink, id, returnObject = false) => {
  prepareDictCheck();
  if (!id || !helpDictPartAndId) {
    return false;
  }

  let res = (partLink == null ? null : helpDictPartAndId[partLink + '___' + id]) ?? helpDictPartAndId[PartsLink.global + '___' + id];
  if (returnObject) {
    return res;
  } else {
    return !!res;
  }
};

class HelpIcon extends React.PureComponent<IHelpIconProps, IHelpIconState> {
  private unNotifHelp: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    let projectId = this.props.paramsProp?.get('projectId');
    let projectFound1 = this.memProjectId(true)(projectId, this.props.projects);

    let projectUseCase = projectFound1?.useCase || null;
    let useCaseInfo = this.memUseCaseInfo(true)(this.props.useCases, projectUseCase);

    this.unNotifHelp = REActions.hideHelpSlide.listen(this.hideHelpSlide);
  }

  hideHelpSlide = (id) => {
    if (id === this.props.id) {
      this.setState({
        selected: false,
      });
    }
  };

  componentDidUpdate(prevProps: Readonly<IHelpIconProps>, prevState: Readonly<IHelpIconState>, snapshot?: any) {
    let projectId = this.props.paramsProp?.get('projectId');
    let projectFound1 = this.memProjectId(true)(projectId, this.props.projects);

    let projectUseCase = projectFound1?.useCase || null;
    let useCaseInfo = this.memUseCaseInfo(true)(this.props.useCases, projectUseCase);
  }

  componentWillUnmount() {
    this.unNotifHelp();
  }

  onClickRoot = (forceId, e) => {
    e && e.stopPropagation?.();
    e && e.preventDefault?.();

    if (this.props.id != undefined) {
      let isSel = !this.state.selected;

      this.setState({
        selected: isSel,
      });

      if (isSel) {
        REActions.showHelpSlide(this.props.id + (forceId ? '' + forceId : ''), this.props.text);
      }
    }
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memUseCaseInfo = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  render() {
    let { id, tooltipText, text, hide, paramsProp, tooltipOnlyIfNonId } = this.props;
    // if(_.startsWith(id, 'metrics_algo_')) {
    // console.warn(id);
    // }

    if (hide) {
      return <span></span>;
    }

    let forceId = null;
    if (tooltipText == null || tooltipOnlyIfNonId) {
      let projectId = paramsProp.get('projectId');
      let projectFound1 = this.memProjectId(false)(projectId, this.props.projects);

      let projectUseCase = projectFound1?.useCase || null;

      let useCaseInfo = this.memUseCaseInfo(false)(this.props.useCases, projectUseCase);
      let projectProblemType = useCaseInfo?.ori?.problemType || null;

      let helpRes = null;
      let helpResTemp = null;

      const checkFast = (extraString) => {
        return checkExistsHelpFor(paramsProp && paramsProp.get('mode'), id + (extraString || ''), true);
      };

      helpRes = checkFast('');
      if (helpRes != null) {
        forceId = null;
      }
      if (projectUseCase) {
        helpResTemp = checkFast('_' + projectUseCase);
        if (helpResTemp != null) {
          helpRes = helpResTemp;
          forceId = '_' + projectUseCase;
        }
      }
      if (projectProblemType) {
        helpResTemp = checkFast('_' + projectProblemType);
        if (helpResTemp != null) {
          helpRes = helpResTemp;
          forceId = '_' + projectProblemType;
        }
      }

      if (helpRes) {
        if (helpRes.title == null && helpRes.description == null) {
          helpRes = null;
        }
      }
      if (!helpRes) {
        if (!tooltipOnlyIfNonId) {
          return <span></span>;
        }
      } else {
        tooltipText = null;
      }
    }

    let res: any = (
      <FontAwesomeIcon icon={['fad', 'question-circle']} transform={{ size: 16, y: 1 }} style={{ fontSize: '16px', marginLeft: '2px', width: '16px', cursor: 'pointer' }} className={s.img + ' ' + (this.state.selected ? s.selected : '')} />
    );
    // <img alt={''} src={calcImgSrc('/app/imgs/question_circle.png')} style={{ width: '16px', cursor: 'pointer', marginBottom: '2px', }} className={s.img+' '+(this.state.selected ? s.selected : '')} />;
    if (tooltipText) {
      res = (
        <TooltipExt isModal={this.props.isModal} title={tooltipText}>
          {res}
        </TooltipExt>
      );
    }

    return (
      <span onClick={this.onClickRoot.bind(this, forceId)} style={this.props.style ?? {}}>
        {res}
      </span>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    useCases: state.useCases,
  }),
  null,
)(HelpIcon);
