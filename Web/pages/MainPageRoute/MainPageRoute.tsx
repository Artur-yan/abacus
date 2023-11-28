import * as React from 'react';
import Utils from '../../core/Utils';
import MainPage from '../../src/components/MainPage/MainPage';
// import 'antd/dist/antd.css';
import * as $ from 'jquery';
import * as _ from 'lodash';
import queryString from 'query-string';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import REActions from '../../src/actions/REActions';
import memoizeOne from '../../src/libs/memoizeOne';
import StoreActions from '../../src/stores/actions/StoreActions';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faAws, faGoogle, faMicrosoft, faSalesforce } from '@fortawesome/free-brands-svg-icons';
import { faBan, faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faCircle, faCog as faCogSolid, faComments as faCommentsS, faFont, faHashtag, faPlus, faStar, faSync, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import {
  faBell as faBellD,
  faBoxOpen as faBoxOpenD,
  faChevronsLeft,
  faChevronsRight,
  faClipboard as faClipboardD,
  faClipboardListCheck as faClipboardListCheckD,
  faComments as faCommentsD,
  faQuestionCircle as faQuestionCircleDuo,
  faSignalStream as faSignalStreamD,
  faStar as faStarD,
  faSync as faSyncD,
  faVial,
  faVials,
} from '@fortawesome/pro-duotone-svg-icons';
import { faAbacus as faAbacusL, faClipboardListCheck as faClipboardListCheckL, faStar as faStarEmpty } from '@fortawesome/pro-light-svg-icons';
import {
  faAnalytics,
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faArrowAltLeft,
  faArrowLeft,
  faBadgeCheck,
  faBallPile,
  faBell,
  faBooksMedical,
  faBoxCheck,
  faBoxOpen,
  faBoxUp,
  faBoxes,
  faBraille,
  faBrain,
  faBriefcase,
  faCalculatorAlt,
  faCaretDown,
  faCaretUp,
  faChartArea,
  faChartBar,
  faChartNetwork,
  faChartPieAlt,
  faChartScatter,
  faCircleXmark,
  faClawMarks,
  faClipboard,
  faClipboardListCheck,
  faClock,
  faCloudUploadAlt,
  faCode,
  faCogs,
  faComment,
  faComments,
  faCompass,
  faCopy,
  faDatabase,
  faDumbbell,
  faEdit,
  faExclamationCircle,
  faFile,
  faFileAlt,
  faFileContract,
  faFileInvoiceDollar,
  faFileUpload,
  faFlagSwallowtail,
  faFluxCapacitor,
  faFolder,
  faFolderOpen,
  faFolders,
  faFunction,
  faHandHoldingBox,
  faHeadSideBrain,
  faInfoCircle,
  faInfoSquare,
  faKey as faKeyN,
  faKeyboard,
  faLaptopCode,
  faLayerGroup,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faMailBulk,
  faMonitorHeartRate,
  faMoon,
  faNetworkWired,
  faNotebook,
  faObjectGroup,
  faPassport,
  faProjectDiagram,
  faQuestionCircle,
  faRobot,
  faRuler,
  faSearch,
  faSearchPlus,
  faServer,
  faSignInAlt,
  faSignalAlt,
  faSignalStream,
  faSitemap,
  faStopwatch,
  faSun,
  faSwatchbook,
  faSync as faSyncR,
  faTachometer,
  faTasksAlt,
  faTools,
  faUpload,
  faUserAlt,
  faUserChart,
  faUsers,
  faUsersClass,
  faVoteYea,
  faWallet,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faAngleDoubleRight as faAngleDoubleRightS,
  faArrowAltSquareRight,
  faArrowProgress,
  faBook as faBookS,
  faBoxOpen as faBoxOpenS,
  faCheck,
  faClipboardListCheck as faClipboardListCheckS,
  faCode as faCodeS,
  faCoins as faCoinsS,
  faDatabase as faDatabaseS,
  faKey,
  faNotebook as faNotebookS,
  faSnowflake as faSnowflakeS,
  faStopwatch as faStopwatchS,
  faTimeline,
  faTimes,
} from '@fortawesome/pro-solid-svg-icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams } from 'react-router';
import REClient_ from '../../src/api/REClient';
import PartsLink from '../../src/components/NavLeft/PartsLink';

// @ts-ignore
library.add(
  faCodeS,
  faFlagSwallowtail,
  faClipboardListCheckS,
  faClipboardListCheck,
  faClipboardListCheckL,
  faClipboardListCheckD,
  faFunction,
  faPassport,
  faNotebook,
  faNotebookS,
  faStarD,
  faUsersClass,
  faMicrosoft,
  faBallPile,
  faDatabaseS,
  faSnowflakeS,
  faCoinsS,
  faAngleDoubleRightS,
  faEdit,
  faMonitorHeartRate,
  faObjectGroup,
  faUserChart,
  faSalesforce,
  faAnalytics,
  faBookS,
  faCogSolid,
  faAbacusL,
  faSignalStream,
  faInfoSquare,
  faBooksMedical,
  faFolderOpen,
  faInfoCircle,
  faComments,
  faCommentsD,
  faCommentsS,
  faComment,
  faSignalStreamD,
  faClipboardD,
  faCopy,
  faChartScatter,
  faArrowAltLeft,
  faFileInvoiceDollar,
  faWallet,
  faChartBar,
  faStopwatch,
  faStopwatchS,
  faTachometer,
  faMailBulk,
  faBellD,
  faNetworkWired,
  faKeyN,
  faBell,
  faFolders,
  faSitemap,
  faSwatchbook,
  faHandHoldingBox,
  faBoxUp,
  faFluxCapacitor,
  faAngleDown,
  faAngleUp,
  faCaretDown,
  faCaretUp,
  faSearch,
  faAngleLeft,
  faAngleRight,
  faCode,
  faBoxOpenS,
  faBoxOpenD,
  faBoxOpen,
  faSyncD,
  faSyncR,
  faQuestionCircleDuo,
  faQuestionCircle,
  faVials,
  faVial,
  faUserAlt,
  faChartArea,
  faExclamationCircle,
  faBoxCheck,
  faTimes,
  faFileUpload,
  faCheck,
  faSearchPlus,
  faClipboard,
  faProjectDiagram,
  faFileContract,
  faHeadSideBrain,
  faCogs,
  faServer,
  faBraille,
  faKeyboard,
  faCalculatorAlt,
  faClawMarks,
  faSignInAlt,
  faBriefcase,
  faLayerGroup,
  faClock,
  faBadgeCheck,
  faChartPieAlt,
  faHashtag,
  faFont,
  faKey,
  faArrowAltSquareRight,
  faArrowLeft,
  faChevronLeft,
  faChevronUp,
  faChevronRight,
  faChevronsRight,
  faChevronsLeft,
  faFolder,
  faFile,
  faVoteYea,
  faSun,
  faMoon,
  faTasksAlt,
  faChartNetwork,
  faSignalAlt,
  faUsers,
  faRuler,
  faCompass,
  faDumbbell,
  faBoxes,
  faCloudUploadAlt,
  faDatabase,
  faChevronDown,
  faFileAlt,
  faSync,
  faSyncAlt,
  faPlus,
  faRobot,
  faLaptopCode,
  faGoogle,
  faAws,
  faTools,
  faBrain,
  faCircle,
  faStar,
  faStarEmpty,
  faTimeline,
  faBan,
  faCircleXmark,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faArrowProgress,
  faUpload,
);
// @ts-ignore
window.jQuery = $;
// @ts-ignore
window.$ = $;

interface IMainPageRouteProps {
  paramsProp?: any;
  // match?: any,
  params?: any;
  mode?: string;
}

interface IMainPageRouteState {
  uuid?: string;
}

let mobileRegExp = /(iPhone|iPod|Opera Mini|Android.*Mobile|NetFront|PSP|BlackBerry|Windows Phone)/g;
let isMobile = mobileRegExp.test(navigator.userAgent);
window['isMobile'] = isMobile;

class MainPageRoute extends React.PureComponent<IMainPageRouteProps, IMainPageRouteState> {
  constructor(props: IMainPageRouteProps, context: any) {
    super(props, context);

    this.state = {
      uuid: uuid.v1(),
    };
  }

  processParams = () => {
    let params = this.props.params || {};
    if (!_.isEmpty(params)) {
      let kk = Object.keys(params);
      kk?.some((k1) => {
        try {
          params[k1] = Utils.decodeRouter(params[k1]);
        } catch (err) {
          //
        }
      });
    }

    let locString = location.search;
    if (!Utils.isNullOrEmpty(locString)) {
      const locParams = queryString.parse(locString);
      if (locParams) {
        params = _.assign(params, locParams);
      }

      const kk = Object.keys(params);
      kk &&
        kk.some((k1) => {
          let v1 = params[k1];
          if (_.endsWith(v1, locString)) {
            v1 = v1.substring(0, v1.length - locString.length);
            params[k1] = v1;
          }
        });
    }

    let mode = this.props.mode;
    if (isMobile) {
      if (
        [
          PartsLink.root,
          PartsLink.finish_billing,
          PartsLink.type_access,
          PartsLink.main,
          PartsLink.accept_invite,
          PartsLink.signin,
          PartsLink.signup,
          PartsLink.signin_verify_account,
          PartsLink.signin_reset_password,
          PartsLink.signin_forgot_new,
          PartsLink.signin_password,
        ].includes(mode as any)
      ) {
        //
      } else {
        mode = PartsLink.mobile_desktop;
      }
    }

    this.prepareParamsMem(mode, params);
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.processParams();
  }

  componentDidMount() {
    $(document).on('contextmenu', (e) => {
      if (window['isD'] === true) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
    });

    this.processParams();

    REActions.reprocessParams.listen(this.processParams);

    REClient_.client_().helptextsDownload((err, res) => {
      StoreActions.helptext = (err ? null : res) ?? {};
      this.forceUpdate();
    });
  }

  memMode = memoizeOne((mode) => {
    if (mode) {
    }
  });

  prepareParamsMem = memoizeOne((mode, props) => {
    let pp = { ...props };
    pp.mode = mode;

    this.memMode(mode);

    if (this.props.paramsProp && _.isEqual(pp, this.props.paramsProp.toJS())) {
      return;
    }

    StoreActions.setParamsProp_(null, pp);
  }, _.isEqual);

  render() {
    return (
      <DndProvider backend={HTML5Backend}>
        <MainPage />
      </DndProvider>
    );
  }
}

const withRouter = (WrappedComponent) =>
  function (props) {
    const params = useParams();
    // etc... other react-router-dom v6 hooks

    return <WrappedComponent {...props} params={params} />;
  };
export default connect((state: any) => ({ paramsProp: state.paramsProp }), null)(withRouter(MainPageRoute));
