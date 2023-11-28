import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import { FeatureGroupExportLifecycle, FeatureGroupExportLifecycleDesc } from '../FeatureGroups/FeatureGroupExportLifecycle';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./FeatureGroupsExport.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupsExportProps {}

const FeatureGroupsExport = React.memo((props: PropsWithChildren<IFeatureGroupsExportProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const projectId = paramsProp?.get('projectId');
  const featureGroupId = paramsProp?.get('featureGroupId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  const onClickDownload = (row, e) => {
    // e.preventDefault();
    e.stopPropagation();

    REActions.addNotification('Downloading...');
    REClient_.client_().getFeatureGroupVersionExportDownloadUrl(row?.featureGroupExportId, (err, res) => {
      let url1 = res?.result?.downloadUrl;
      if (!Utils.isNullOrEmpty(url1)) {
        window.open(url1, '_blank');
      } else {
        REActions.addNotificationError(Constants.errorDefault);
      }
    });
  };

  const onClickDeleteExport = (exportId, e) => {
    if (!exportId) {
      return;
    }
  };

  const exportsColumns = useMemo(() => {
    let columns: ITableExtColumn[] = [
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld date={text} />;
        },
        width: 200,
        noLink: true,
      },
      {
        title: 'Export ID',
        field: 'featureGroupExportId',
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
        width: 130,
        noLink: true,
      },
      {
        title: 'FG Version',
        field: 'featureGroupVersion',
        isLinked: true,
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
        width: 130,
      },
      {
        title: 'Status',
        field: 'status',
        width: 160,
        noLink: true,
        render: (text, row, index) => {
          if ([FeatureGroupExportLifecycle.EXPORTING, FeatureGroupExportLifecycle.PENDING].includes(row.status || '')) {
            StoreActions.refreshDoFeatureGroupsExportsAll_(row.featureGroupExportId, featureGroupId);
          }

          let isTraining = (row.exportId ?? row.featureGroupExportId) && StoreActions.refreshFeatureGroupsExportsUntilStateIsTraining_(row.exportId ?? row.featureGroupExportId);

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{FeatureGroupExportLifecycleDesc[row.status ?? '']}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{FeatureGroupExportLifecycleDesc[row.status ?? '']}</span>;
            if ([FeatureGroupExportLifecycle.FAILED].includes(row.status || '')) {
              res = <span className={sd.red}>{res}</span>;
              if (row.lifecycleMsg) {
                res = <TooltipExt title={row.lifecycleMsg}>{res}</TooltipExt>;
              }
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ([FeatureGroupExportLifecycle.FAILED].includes(row.status || '')) {
            let lifecycleMsg = row.lifecycleMsg ?? row.error;
            if (lifecycleMsg) {
              res = (
                <span key={'res' + row.featureGroupExportId}>
                  <span
                    css={`
                      margin-right: 5px;
                    `}
                  >
                    Error:
                  </span>
                  <span
                    css={`
                      color: #bf2c2c;
                    `}
                  >
                    {lifecycleMsg}
                  </span>
                </span>
              );
            }
          }

          let res2 = null;

          if (row.databaseOutputError === true) {
            res2 = (
              <span key={'res2' + row.featureGroupExportId}>
                <span
                  css={`
                    margin-right: 5px;
                  `}
                >
                  Error:
                </span>
                <Link to={'/api/getFeatureGroupExportConnectorErrors?featureGroupExportId=' + encodeURIComponent(row.featureGroupExportId)} newWindow noApp>
                  <Button size={'small'} ghost>
                    Download Error Logs
                  </Button>
                </Link>
              </span>
            );
          }

          if (res != null && res2 != null) {
            return (
              <div>
                {res}
                <div
                  css={`
                    margin-top: 12px;
                  `}
                ></div>
                {res2}
              </div>
            );
          } else {
            return res ?? res2 ?? null;
          }
        },
      },
      {
        title: 'Connector Type',
        field: 'connectorType',
        width: 150,
        render: (text, row, index) => {
          return Utils.upperFirst(text.split('_')?.[0] ?? '');
        },
        noLink: true,
      },
      {
        hideLessMedium: true,
        title: 'DB Connector ID',
        field: 'databaseConnectorId',
        width: 150,
        noLink: true,
      },
      {
        hideLessMedium: true,
        title: 'Location',
        field: 'outputLocation',
        noLink: true,
        render: (text, row, index) => {
          return row.outputLocation ?? row.objectName;
        },
      },
    ];

    columns.push({
      noAutoTooltip: true,
      noLink: true,
      title: 'actions',
      field: 'actions',
      width: 150,
      render: (text, row) => {
        let popupContainerForMenu = (node) => document.getElementById('body2');

        const menu = (
          <Menu getPopupContainer={popupContainerForMenu}>
            {/*<Menu.Item onClick={onClickFeaturesEditGo.bind(null, row.featureGroupId)}>Edit</Menu.Item>*/}
            {/*<Menu.Item onClick={onClickFeaturesGo.bind(null, row.featureGroupId)}>Features</Menu.Item>*/}
            {/*<Menu.Item onClick={onClickFeaturesExportGo.bind(null, row.featureGroupId)}>Export</Menu.Item>*/}
            {/*{<Menu.Item>*/}
            {/*  <ModalConfirm onConfirm={onClickDeleteExport.bind(null, row?.exportId ?? row?.featureGroupExportId)} title={`Do you want to delete this export"?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>*/}
            {/*    <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red', }}>Delete</div>*/}
            {/*  </ModalConfirm>*/}
            {/*</Menu.Item>}*/}
          </Menu>
        );

        const styleButton: CSSProperties = { margin: '4px' };
        // const showMenu = (DeploymentLifecycle.ACTIVE === lifecycle) || (![DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(lifecycle));

        const isConsole = ['CONSOLE', 'DOWNLOAD'].includes(row?.connectorType?.toUpperCase());
        const isComplete = row?.status?.toUpperCase() === 'COMPLETE';

        if (!isComplete) {
          return <span></span>;
        }

        return (
          <span style={{ whiteSpace: 'normal' }}>
            {/*{<Link forceSpanUse to={'/'+PartsLink.features_list+'/'+projectId+'/'+row.featureGroupId}><Button style={{ marginLeft: '8px', marginBottom: '4px', }} type={'default'} ghost>Dashboard</Button></Link>}*/}
            {/*{<Link forceSpanUse to={'/'+PartsLink.feature_groups_edit+'/'+projectId+'/'+row.featureGroupId}><Button style={{ marginBottom: '4px', marginLeft: '8px', }} type={'default'} ghost>Edit</Button></Link>}*/}
            {/*{[DeploymentLifecycle.FAILED, DeploymentLifecycle.STOPPED, DeploymentLifecycle.CANCELLED].includes(lifecycle) && <Button style={{ marginLeft: '8px', marginBottom: '4px', }} onClick={this.onClickRestartDeployment.bind(this, row?.deploymentId)} ghost>Re-Start</Button>}*/}
            {/*{!isConsole && <Dropdown overlay={menu} trigger={['click']}>*/}
            {/*  <Button style={styleButton} ghost type={'default'} onClick={onClickCancelEvents}>Actions</Button>*/}
            {/*</Dropdown>}*/}
            {isConsole && (
              <Button style={styleButton} ghost type={'default'} onClick={onClickDownload.bind(null, row)}>
                Download
              </Button>
            )}
          </span>
        );
      },
    });

    return columns;
  }, []);

  useEffect(() => {
    featureGroups.memFeatureExportsForFeatureGroupId(true, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);
  const exportsList = useMemo(() => {
    return featureGroups.memFeatureExportsForFeatureGroupId(false, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  const onClickBack = (e) => {
    Location.push('/' + PartsLink.feature_groups + '/' + projectId);
  };

  const navigateToFeatureGroupDetail = () => {
    return '/' + PartsLink.feature_group_detail + '/' + projectId + '/' + featureGroupId;
  };

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 10px 30px;
      `}
    >
      <RefreshAndProgress isRefreshing={isRefreshing}>
        <div
          className={sd.titleTopHeaderAfter}
          style={{ height: topAfterHeaderHH }}
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <div>Feature Groups Exports</div>
          <div
            css={`
              flex: 1;
            `}
          ></div>
          {/*<div>*/}
          {/*  <Button type={'primary'} onClick={onClickBack}>Back</Button>*/}
          {/*</div>*/}
        </div>
        <div
          css={`
            position: absolute;
            top: ${topAfterHeaderHH}px;
            left: 0;
            right: 0;
            bottom: 0;
          `}
        >
          <AutoSizer disableWidth>
            {({ height }) => {
              return (
                <TableExt
                  defaultSort={{ field: 'createdAt', isAsc: false }}
                  height={height}
                  showEmptyIcon={true}
                  dataSource={exportsList}
                  columns={exportsColumns}
                  calcKey={(r1) => r1.featureGroupId}
                  calcLink={navigateToFeatureGroupDetail}
                />
              );
            }}
          </AutoSizer>
        </div>
      </RefreshAndProgress>
    </div>
  );
});

export default FeatureGroupsExport;
