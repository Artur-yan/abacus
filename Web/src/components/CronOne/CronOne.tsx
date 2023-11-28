import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import cronstrue from 'cronstrue';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import FormExt from '../FormExt/FormExt';
import InputCron from '../InputCron/InputCron';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./CronOne.module.css');
const sd = require('../antdUseDark.module.css');

interface ICronOneProps {
  error?: string;
  cron?: string;
  nextRun?: string;
  refreshPolicyId?: string;
  onDeleteDone?: () => void;

  isNew?: boolean;
  onPlayNow?: () => void;
  onCreateNew?: () => void;
  onEdit?: () => void;
  projectId?: string;
  datasetIds?: string[];
  modelIds?: string[];
  batchPredictionIds?: string[];
  deploymentIds?: string[];
  refreshType?: string;

  modelMonitorIds?: string[];
  predictionMetricsIds?: string[];
  edaIds?: string[];
  isProd?: boolean;
  notebookId?: string;
  hideRun?: boolean;
  hidePause?: boolean;
  noMargin?: boolean;
  featureGroupId?: string;
}

const CronOne = React.memo((props: PropsWithChildren<ICronOneProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const onClickDelete = (e) => {
    REActions.addNotification('Deleting Refresh Policy...');
    REClient_.client_().deleteRefreshPolicy(props.refreshPolicyId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err);
      } else {
        props.onDeleteDone?.();
        REActions.addNotification('Refresh Policy Deleted');
      }
    });
  };

  const onClickEdit = (e) => {
    props.onEdit ? props.onEdit() : setShowCronEdit(true);
  };

  const onClickRun = (e) => {
    REActions.addNotification('Running Refresh Policy...');
    REClient_.client_().runRefreshPolicy(props.refreshPolicyId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Refresh Policy run started...');
        props.onPlayNow?.();
      }
    });
  };

  const desc1 = useMemo(() => {
    let exp1;
    try {
      exp1 = cronstrue.toString(props.cron);
    } catch (e) {
      exp1 = null;
    }
    if (!_.isString(exp1)) {
      exp1 = null;
    }
    if (!Utils.isNullOrEmpty(exp1)) {
      exp1 += ' UTC';
    }
    return exp1;
  }, [props.cron]);

  const isNew = props.isNew;

  const [showCronNew, setShowCronNew] = useState(false);
  const [showCronEdit, setShowCronEdit] = useState(false);
  const [prod, setProd] = useState(false);

  React.useEffect(() => {
    setProd(props.isProd);
  }, [props.isProd]);

  const onClickAddNew = (e) => {
    setShowCronNew(true);
  };

  const [newCronValue, setNewCronValue] = useState('');

  const doRefreshNeeded = () => {
    StoreActions.listDatasets_(props.datasetIds);
    if (props.projectId) {
      StoreActions.getProjectDatasets_(props.projectId);
      if (props.deploymentIds) {
        StoreActions.deployList_(props.projectId);
      }
    }
    if (props.modelIds) {
      props.modelIds.some((id1) => {
        StoreActions.getModelDetail_(id1);
      });
      StoreActions.listModels_(props.projectId);
    }
    if (props.batchPredictionIds) {
      props.batchPredictionIds.some((id1) => {
        StoreActions.batchDescribeById_(id1);
      });
      StoreActions.batchList_(props.projectId);
    }
    if (props.modelMonitorIds) {
      props.modelMonitorIds.some((id1) => {
        StoreActions.describeModelMonitorById_(id1);
      });
      StoreActions.listMonitoringModels_(props.projectId);
    }
    if (props.edaIds) {
      props.edaIds.some((id1) => {
        StoreActions.describeEda_(id1);
      });
      StoreActions.listEda_(props.projectId);
    }
    if (props.notebookId) {
      StoreActions.describeNotebook_(props.notebookId);
    }
    if (props.featureGroupId) {
      StoreActions.featureRefreshPolicieList(props.featureGroupId);
    }
  };

  const onChangeCronValue = (v1) => {
    setNewCronValue(v1);
  };
  const onClickAddNewAccept = (e) => {
    if (_.trim(newCronValue || '') === '') {
      REActions.addNotificationError('Empty value');
    } else {
      let refreshType = '';
      if (props.datasetIds?.length > 0) {
        refreshType = 'dataset';
      }
      if (props.modelIds?.length > 0) {
        refreshType = 'model';
      }
      if (props.batchPredictionIds?.length > 0) {
        refreshType = 'batchpred';
      }
      if (props.deploymentIds?.length > 0) {
        refreshType = 'deployment';
      }
      if (props.predictionMetricsIds?.length > 0) {
        refreshType = 'predictionmetric';
      }
      if (props.modelMonitorIds?.length > 0) {
        refreshType = 'modelmonitor';
      }
      if (props.notebookId) {
        refreshType = 'NOTEBOOK';
      }

      refreshType = refreshType?.toUpperCase();

      REClient_.client_().createRefreshPolicy(
        '',
        newCronValue,
        refreshType,
        props.projectId,
        props.datasetIds,
        props.featureGroupId,
        props.modelIds,
        props.deploymentIds,
        props.batchPredictionIds,
        props.predictionMetricsIds,
        props.modelMonitorIds,
        props.notebookId,
        null,
        (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            setNewCronValue('');
            setShowCronNew(false);

            doRefreshNeeded();

            props.onCreateNew?.();
          }
        },
      );
    }
  };
  const onClickAddNewCancel = (e) => {
    setShowCronNew(false);
  };

  const onClickAddNewAcceptEdit = (e) => {
    if (_.trim(newCronValue || '') === '') {
      REActions.addNotificationError('Empty value / Not Changed');
    } else {
      updateRefreshPolicy(props.refreshPolicyId, newCronValue, prod);
    }
  };

  const updateRefreshPolicy = (refreshPolicyId, cronValue, isProd) => {
    REClient_.client_().updateRefreshPolicy(refreshPolicyId, '', cronValue, isProd, null, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        setNewCronValue('');
        setShowCronEdit(false);

        doRefreshNeeded();
      }
    });
  };

  const onClickAddNewCancelEdit = (e) => {
    setShowCronEdit(false);
  };

  const onChangeIsProd = (e) => {
    setProd(e.target?.checked);

    if (props.refreshPolicyId) {
      updateRefreshPolicy(props.refreshPolicyId, props.cron, e.target?.checked);
    }
  };

  const doPausePolicy = (e) => {
    REClient_.client_().pauseRefreshPolicy(props.refreshPolicyId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        doRefreshNeeded();
      }
    });
  };
  const doResumePolicy = (e) => {
    REClient_.client_().resumeRefreshPolicy(props.refreshPolicyId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        doRefreshNeeded();
      }
    });
  };

  // @ts-ignore
  const isPaused = props.nextRun == null || props.nextRun === '' || props.nextRun === 0;

  return (
    <>
      <div>
        <span
          style={{ whiteSpace: 'nowrap' }}
          css={`
            .subItems {
              opacity: 0;
              transition: opacity 200ms;
            }
            :hover .subItems {
              opacity: 1;
            }
          `}
        >
          {isNew && !showCronNew && (
            <Button size={'small'} onClick={onClickAddNew} type={'default'} ghost style={{ padding: '0 13px', height: '26px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}>
              <span className={sd.styleTextGray}>Add new refresh schedule...</span>
            </Button>
          )}
          {isNew && showCronNew && (
            <span
              css={`
                display: flex;
              `}
            >
              <span
                css={`
                  flex: 1;
                `}
              >
                <FormExt layout={'vertical'}>
                  <InputCron isNew onChange={onChangeCronValue} style={{ marginTop: '4px' }} />
                </FormExt>
              </span>
              <span
                css={`
                  padding-top: 43px;
                  padding-left: 15px;
                `}
              >
                <Button size={'small'} onClick={onClickAddNewAccept} type={'primary'} ghost className={sd.detailbuttonblueBorder} style={{ padding: '0 13px', height: '26px', marginTop: '4px' }}>
                  Add
                </Button>
                <Button size={'small'} onClick={onClickAddNewCancel} type={'default'} ghost style={{ height: '26px', padding: '0 13px', marginLeft: '10px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}>
                  Cancel
                </Button>
              </span>
            </span>
          )}
          {!isNew && showCronEdit && (
            <span
              css={`
                display: flex;
              `}
            >
              <span
                css={`
                  flex: 1;
                `}
              >
                <FormExt layout={'vertical'}>
                  <InputCron isNew defaultValue={props.cron} onChange={onChangeCronValue} style={{ marginTop: '4px' }} />
                </FormExt>
              </span>
              <span
                css={`
                  padding-top: 43px;
                  padding-left: 15px;
                `}
              >
                <Button size={'small'} onClick={onClickAddNewAcceptEdit} type={'primary'} ghost className={sd.detailbuttonblueBorder} style={{ padding: '0 13px', height: '26px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}>
                  Set
                </Button>
                <Button size={'small'} onClick={onClickAddNewCancelEdit} type={'default'} ghost style={{ height: '26px', padding: '0 13px', marginLeft: '10px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}>
                  Cancel
                </Button>
              </span>
            </span>
          )}
          {!isNew && !showCronEdit && <span style={{ fontSize: '13px', padding: '3px 5px', marginLeft: props.noMargin ? 0 : '10px' }}>{props?.refreshType?.toLowerCase()} schedule:</span>}
          {!isNew && !showCronEdit && <span style={{ fontSize: '13px', padding: '3px 5px', border: '1px solid ' + Utils.colorA(0.1), borderRadius: '2px' }}>{props.cron || '-'}</span>}
          {!isNew && !showCronEdit && (
            <span
              className={sd.styleTextGray}
              style={{ marginLeft: '5px' }}
              css={`
                white-space: normal;
              `}
            >
              {desc1}
            </span>
          )}
          {!isNew && !showCronEdit && props.nextRun != null && <span style={{ marginLeft: '5px', color: Utils.colorA(0.7), fontSize: '14px' }}>&nbsp;-&nbsp;Next Run:&nbsp;{moment(props.nextRun).format('LLL')}</span>}
          {!isNew && !showCronEdit && isPaused && (
            <span
              css={`
                margin-left: 10px;
                font-size: 14px;
              `}
            >
              (Paused)
            </span>
          )}
          <span
            className={'subItems'}
            css={`
              margin-left: ${!isNew && !showCronEdit && !Utils.isNullOrEmpty(props.refreshPolicyId) ? 10 : 0}px;
            `}
          >
            {!isNew && !showCronEdit && !Utils.isNullOrEmpty(props.refreshPolicyId) && (
              <span
                onClick={onClickEdit}
                css={`
                  opacity: 0.8;
                  :hover {
                    opacity: 1;
                  }
                `}
              >
                <TooltipExt title={'Edit'}>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '4px' }} />
                </TooltipExt>
              </span>
            )}
            {!props.hideRun && !isNew && !showCronEdit && !Utils.isNullOrEmpty(props.refreshPolicyId) && (
              <ModalConfirm onConfirm={onClickRun} title={`Do you want to manually run the Refresh Policy?`} icon={<QuestionCircleOutlined />} okText={'Run'} cancelText={'Cancel'} okType={'primary'}>
                <TooltipExt title={'Manual Run'}>
                  <span
                    css={`
                      opacity: 0.8;
                      :hover {
                        opacity: 1;
                      }
                    `}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlay').faPlay} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '7px' }} />
                  </span>
                </TooltipExt>
              </ModalConfirm>
            )}
            {!isNew && !showCronEdit && !Utils.isNullOrEmpty(props.refreshPolicyId) && (
              <ModalConfirm onConfirm={onClickDelete} title={`Do you want to delete the Refresh Policy?`} icon={<QuestionCircleOutlined />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>
                <TooltipExt title={'Remove'}>
                  <span
                    css={`
                      opacity: 0.8;
                      :hover {
                        opacity: 1;
                      }
                    `}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTrash').faTrash} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'red', cursor: 'pointer', marginLeft: '7px' }} />
                  </span>
                </TooltipExt>
              </ModalConfirm>
            )}
            {!isNew && !showCronEdit && !Utils.isNullOrEmpty(props.refreshPolicyId) && calcAuthUserIsLoggedIn()?.isInternal === true && props.refreshType?.toUpperCase() === 'BATCHPRED' && (
              <TooltipExt title={'Prod'}>
                <Checkbox checked={!!prod} style={{ marginLeft: '4px' }} onChange={onChangeIsProd} />
              </TooltipExt>
            )}
            {!props.hidePause && !isNew && !showCronEdit && !Utils.isNullOrEmpty(props.refreshPolicyId) && (
              <span
                css={`
                  margin-left: 10px;
                `}
              >
                <Button
                  size={'small'}
                  css={`
                    height: 24px;
                    opacity: 0.8;
                    transition: opacity 200ms;
                    :hover {
                      opacity: 1;
                    }
                  `}
                  onClick={isPaused ? doResumePolicy : doPausePolicy}
                  type={'primary'}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              </span>
            )}
          </span>
        </span>
      </div>
      {!Utils.isNullOrEmpty(props.error) && (
        <div
          css={`
            margin: 4px 0 7px 25px;
            display: flex;
            align-items: center;
            font-size: 13px;
          `}
        >
          <div
            css={`
              color: white;
              margin-right: 12px;
            `}
          >
            <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowAltFromLeft').faArrowAltFromLeft} transform={{ size: 17, x: 0, y: 0 }} />
          </div>
          <div
            css={`
              flex: 1;
            `}
          >
            <span
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <span
                css={`
                  margin-right: 5px;
                  white-space: nowrap;
                  opacity: 0.7;
                  font-weight: normal;
                `}
              >
                Error:
              </span>
              <span
                css={`
                  color: #bf2c2c;
                  display: inline-block;
                `}
              >
                {props.error}
              </span>
            </span>
          </div>
        </div>
      )}
    </>
  );
});

export default CronOne;
