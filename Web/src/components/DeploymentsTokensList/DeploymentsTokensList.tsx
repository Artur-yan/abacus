import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import { calcDeploymentsTokensByProjectId } from '../../stores/reducers/deploymentsTokens';
import CopyText from '../CopyText/CopyText';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalConfirmCreateNewToken from '../ModalConfirmCreateNewToken/ModalConfirmCreateNewToken';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';

const s = require('./DeploymentsTokensList.module.css');
const sd = require('../antdUseDark.module.css');

interface IDeploymentsTokensListProps {
  deployments?: any;
  deploymentsTokens?: any;
  paramsProp?: any;
  isSmall?: boolean;
}

interface IDeploymentsTokensListState {}

class DeploymentsTokensList extends React.PureComponent<IDeploymentsTokensListProps, IDeploymentsTokensListState> {
  private isM: boolean;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount(): void {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;
  }

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let listDeploymentsTokens = this.memDeploymentTokensList(true)(this.props.deploymentsTokens, projectId);
    let listDeployments = this.memDeploymentList(true)(this.props.deployments, projectId);
  };

  componentDidUpdate(prevProps: Readonly<IDeploymentsTokensListProps>, prevState: Readonly<IDeploymentsTokensListState>, snapshot?: any): void {
    this.doMem();
  }

  memDeploymentTokensList = memoizeOneCurry((doCall, deploymentsTokens, projectId) => {
    if (deploymentsTokens) {
      if (deploymentsTokens.get('isRefreshing')) {
        return;
      }
      //
      let res = calcDeploymentsTokensByProjectId(undefined, projectId);
      if (res == null) {
        if (doCall) {
          StoreActions.deployTokensList_(projectId);
        }
      } else {
        return res;
      }
    }
  });

  onClickDeleteDeployToken = (deploymentToken) => {
    if (deploymentToken) {
      REClient_.client_().deleteDeploymentToken(deploymentToken, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Done!');
          StoreActions.deployTokensList_(this.props.paramsProp && this.props.paramsProp.get('projectId'));
        }
      });
    }
  };

  onClickCreateToken = (name) => {
    REClient_.client_().createDeploymentToken(this.props.paramsProp && this.props.paramsProp.get('projectId'), name, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');
        StoreActions.deployTokensList_(this.props.paramsProp && this.props.paramsProp.get('projectId'));
      }
    });
  };

  onClickCopyToken = (apiKey, e) => {
    e && e.preventDefault();

    UtilsWeb.copyToClipboard(apiKey);

    REActions.addNotification('Copied Deployment Auth Token to clipboard');
  };

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId) => {
    if (deployments && projectId) {
      if (deployments.get('isRefreshing') !== 0) {
        return;
      }
      //
      let res = calcDeploymentsByProjectId(undefined, projectId);
      if (res == null) {
        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        return res;
      }
    }
  });

  render() {
    let { deploymentsTokens, paramsProp } = this.props;
    const styleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px', width: '90px' };

    let projectId = paramsProp && paramsProp.get('projectId');
    let listDeploymentsTokens = this.memDeploymentTokensList(false)(deploymentsTokens, projectId);

    let columns: ITableExtColumn[] = [
      {
        title: 'Name',
        field: 'name',
        render: (text, row, index) => {
          if (!text) {
            return '-';
          } else {
            return text;
          }
        },
      },
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text, row, index) => {
          if (!text) {
            return '-';
          } else {
            return moment(text).format('LLL');
          }
        },
      },
      {
        title: 'Deployment Token',
        field: 'deploymentToken',
        helpId: 'deploymenttoken',
        render: (text, row, index) => {
          return <CopyText noNoWrap>{text}</CopyText>;
        },
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        field: 'actions',
        render: (text, row?: any) => (
          <span>
            <ModalConfirm
              onConfirm={this.onClickDeleteDeployToken.bind(this, row?.deploymentToken)}
              title={`Do you want to delete token "${row.deploymentToken || ''}"?`}
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              okText={'Delete'}
              cancelText={'Cancel'}
              okType={'danger'}
            >
              <Button danger ghost>
                Delete
              </Button>
            </ModalConfirm>
          </span>
        ),
      },
    ];

    let isRefreshing = false;
    if (deploymentsTokens) {
      if (deploymentsTokens.get('isRefreshing')) {
        isRefreshing = true;
      }
    }

    let tableHH = (hh) => (
      <RefreshAndProgress isRelative={hh == null} isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt
          showEmptyIcon={true}
          defaultSort={{ field: 'createdAt', isAsc: false }}
          notsaveSortState={'deployment_tokens_list'}
          height={hh}
          dataSource={listDeploymentsTokens}
          columns={columns}
          calcKey={(r1) => r1.deploymentToken}
          calcLink={(row) => (projectId ? '/' + PartsLink.deploy_list + '/' + projectId : null)}
        />
      </RefreshAndProgress>
    );

    let table = null;
    if (this.props.isSmall) {
      table = tableHH(null);
    } else {
      table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH)}</AutoSizer>;
    }

    let { deployments } = this.props;
    let listDeployments = this.memDeploymentList(false)(deployments, projectId);
    let showCreateToken = false;
    if (listDeployments && listDeployments.length > 0) {
      listDeployments.some((d1) => {
        if (d1.status && d1.status.toLowerCase() === 'active') {
          showCreateToken = true;
          return true;
        }
      });
    }

    return (
      <div className={(this.props.isSmall ? '' : sd.absolute) + ' ' + sd.table} style={_.assign({ margin: '25px' }, this.props.isSmall ? {} : { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }) as CSSProperties}>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          <span style={{ float: 'right' }}>
            {showCreateToken && (
              <ModalConfirmCreateNewToken onConfirm={this.onClickCreateToken}>
                <Button type={'primary'}>Create New Token</Button>
              </ModalConfirmCreateNewToken>
            )}
          </span>
          Deployment Tokens
          <HelpIcon id={'deploymenttokenslist_title'} style={{ marginLeft: '4px' }} />
          &nbsp;
        </div>

        {table}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    deployments: state.deployments,
    deploymentsTokens: state.deploymentsTokens,
  }),
  null,
)(DeploymentsTokensList);
