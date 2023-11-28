import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
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
import FormExt from '../FormExt/FormExt';
import InputCron from '../InputCron/InputCron';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import TooltipExt from '../TooltipExt/TooltipExt';
import globalStyles from '../antdUseDark.module.css';

import { faArrowAltFromLeft } from '@fortawesome/pro-regular-svg-icons/faArrowAltFromLeft';
import { faTrash } from '@fortawesome/pro-regular-svg-icons/faTrash';
import { faEdit } from '@fortawesome/pro-regular-svg-icons/faEdit';

interface ICronOneProps {
  error?: string;
  cron?: string;
  nextRun?: string;
  pipelineId?: string;
  pipelineName: string;
  onDeleteDone?: () => void;

  isNew?: boolean;
  isProd?: boolean;
  notebookId?: string;
  hideRun?: boolean;
  hidePause?: boolean;
  noMargin?: boolean;
}

const PipelineCron = React.memo((props: PropsWithChildren<ICronOneProps>) => {
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
    REClient_.client_().unsetPipelineRefreshSchedule(props.pipelineId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err);
      } else {
        props.onDeleteDone?.();
        REActions.addNotification('Refresh Policy Deleted');
        doRefreshNeeded();
      }
    });
  };

  const onClickEdit = (e) => {
    setShowCronEdit(true);
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
    StoreActions.describePipeline(props.pipelineId);
  };

  const onChangeCronValue = (v1) => {
    setNewCronValue(v1);
  };
  const onClickAddNewAccept = (e) => {
    if (_.trim(newCronValue || '') === '') {
      REActions.addNotificationError('Empty value');
    } else {
      REClient_.client_().updatePipeline(props.pipelineId, [], newCronValue, null, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          setNewCronValue('');
          setShowCronNew(false);

          doRefreshNeeded();
        }
      });
    }
  };
  const onClickAddNewCancel = (e) => {
    setShowCronNew(false);
  };

  const onClickAddNewAcceptEdit = (e) => {
    if (_.trim(newCronValue || '') === '') {
      REActions.addNotificationError('Empty value / Not Changed');
    } else {
      updateRefreshPolicy(props.pipelineId, newCronValue);
    }
  };

  const updateRefreshPolicy = (pipelineId, cronValue) => {
    REClient_.client_().updatePipeline(pipelineId, [], cronValue, null, (err, res) => {
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

  const doPausePolicy = (e) => {
    REClient_.client_().pausePipelineRefreshSchedule(props.pipelineId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        doRefreshNeeded();
      }
    });
  };
  const doResumePolicy = (e) => {
    REClient_.client_().resumePipelineRefreshSchedule(props.pipelineId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        doRefreshNeeded();
      }
    });
  };

  // @ts-ignore
  const isPaused = (props.nextRun == null || props.nextRun === '' || props.nextRun === 0) && props.cron != null;

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
          {props.cron == null && !showCronNew && (
            <Button size={'small'} onClick={onClickAddNew} type={'default'} ghost style={{ padding: '0 13px', height: '26px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}>
              <span className={globalStyles.styleTextGray}>Add new refresh schedule...</span>
            </Button>
          )}
          {props.cron == null && showCronNew && (
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
                <Button size={'small'} onClick={onClickAddNewAccept} type={'primary'} ghost className={globalStyles.detailbuttonblueBorder} style={{ padding: '0 13px', height: '26px', marginTop: '4px' }}>
                  Add
                </Button>
                <Button size={'small'} onClick={onClickAddNewCancel} type={'default'} ghost style={{ height: '26px', padding: '0 13px', marginLeft: '10px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}>
                  Cancel
                </Button>
              </span>
            </span>
          )}
          {props.cron != null && showCronEdit && (
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
                <Button
                  size={'small'}
                  onClick={onClickAddNewAcceptEdit}
                  type={'primary'}
                  ghost
                  className={globalStyles.detailbuttonblueBorder}
                  style={{ padding: '0 13px', height: '26px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}
                >
                  Set
                </Button>
                <Button size={'small'} onClick={onClickAddNewCancelEdit} type={'default'} ghost style={{ height: '26px', padding: '0 13px', marginLeft: '10px', marginTop: '4px', borderColor: 'rgba(255,255,255,0.6)' }}>
                  Cancel
                </Button>
              </span>
            </span>
          )}
          {props.cron != null && !showCronEdit && <span style={{ fontSize: '13px', padding: '3px 5px', marginLeft: props.noMargin ? 0 : '10px' }}> schedule:</span>}
          {props.cron != null && !showCronEdit && <span style={{ fontSize: '13px', padding: '3px 5px', border: '1px solid ' + Utils.colorA(0.1), borderRadius: '2px' }}>{props.cron || '-'}</span>}
          {props.cron != null && !showCronEdit && (
            <span
              className={globalStyles.styleTextGray}
              style={{ marginLeft: '5px' }}
              css={`
                white-space: normal;
              `}
            >
              {desc1}
            </span>
          )}
          {props.cron != null && !showCronEdit && props.nextRun != null && <span style={{ marginLeft: '5px', color: Utils.colorA(0.7), fontSize: '14px' }}>&nbsp;-&nbsp;Next Run:&nbsp;{moment(props.nextRun).format('LLL')}</span>}
          {props.cron != null && !showCronEdit && isPaused && (
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
              margin-left: ${props.cron != null && !showCronEdit && !Utils.isNullOrEmpty(props.pipelineId) ? 10 : 0}px;
            `}
          >
            {props.cron != null && !showCronEdit && !Utils.isNullOrEmpty(props.pipelineId) && (
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
                  <FontAwesomeIcon icon={faEdit} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '4px' }} />
                </TooltipExt>
              </span>
            )}
            {props.cron != null && !showCronEdit && !Utils.isNullOrEmpty(props.pipelineId) && (
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
                    <FontAwesomeIcon icon={faTrash} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'red', cursor: 'pointer', marginLeft: '7px' }} />
                  </span>
                </TooltipExt>
              </ModalConfirm>
            )}
            {!props.hidePause && props.cron != null && !showCronEdit && !Utils.isNullOrEmpty(props.cron) && (
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
            <FontAwesomeIcon icon={faArrowAltFromLeft} transform={{ size: 17, x: 0, y: 0 }} />
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

export default PipelineCron;
