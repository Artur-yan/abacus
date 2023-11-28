import * as React from 'react';
const s = require('./StreamingTestRecords.module.css');
const sd = require('../antdUseDark.module.css');
import { connect } from 'react-redux';
import Constants from '../../constants/Constants';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import * as _ from 'lodash';
import cx from 'classnames';
import REActions from '../../actions/REActions';
import Reflux from 'reflux';
import $ from 'jquery';
import memoizeOne, { memoizeOneCurry, memoizeBind } from '../../libs/memoizeOne';
import * as Immutable from 'immutable';
import { PropsWithChildren, useMemo, useState, useEffect, useCallback, useContext, useRef, useReducer, CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { css } from 'styled-components';
import REClient_ from '../../api/REClient';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import * as moment from 'moment';
import Button from 'antd/lib/button';
import PartsLink from '../NavLeft/PartsLink';
import StoreActions from '../../stores/actions/StoreActions';

interface IStreamingTestRecordsProps {
  style?: CSSProperties;
  datasetId?: string;
  projectId?: string;
}

const StreamingTestRecords = React.memo((props: PropsWithChildren<IStreamingTestRecordsProps>) => {
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

  const style1 = useMemo(() => {
    return _.assign(
      {
        margin: '40px 0',
      } as CSSProperties,
      props.style ?? {},
    );
  }, [props.style]);

  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!props.datasetId) {
      return;
    }

    setRows([]);

    const doWork = () => {
      return new Promise((resolve, reject) => {
        REClient_.client_()._getRecentWrites(props.datasetId, (err, res) => {
          if (!err && res?.success) {
            const c1 = res?.result ?? [];
            if (!_.isEqual(rows, c1)) {
              setRows(c1);
            }
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    };

    let interval,
      isExit = false;
    const doTime = (isOk) => {
      if (isExit) {
        return;
      }
      interval = setTimeout(
        () => {
          interval = null;

          doWork().then((ok) => {
            doTime(ok);
          });
        },
        isOk ? 1500 : 10 * 1000,
      );
    };
    doWork().then((ok) => {
      doTime(ok);
    });

    return () => {
      isExit = true;
      if (interval != null) {
        clearTimeout(interval);
        interval = null;
      }
    };
  }, [props.datasetId, props.projectId]);

  const columns = useMemo(() => {
    if (rows && rows.length > 0) {
      let res: ITableExtColumn[] = [];

      let kk = Object.keys(rows[0] || {});
      kk = kk.sort();
      const kkFirst = _.reverse(['userid', 'itemid', 'key', 'timestamp']);
      kkFirst.some((k1) => {
        let ind = kk.findIndex((k) => k?.toLowerCase() === k1);
        if (ind > -1) {
          let kRemove = kk.splice(ind, 1)?.[0];
          if (kRemove != null) {
            kk.unshift(kRemove);
          }
        }
      });

      kk.some((k1) => {
        let col1: ITableExtColumn = {
          title: k1 || '-',
          field: k1,
          render: (text, row, index) => {
            if (_.isObject(text)) {
              return '{...}';
            } else {
              return text;
            }
          },
        };
        if (k1?.toLowerCase() === 'timestamp') {
          col1.render = (text, row, index) => {
            return <TooltipExt title={moment(text).format('LLL')}>{text}</TooltipExt>;
          };
        }
        res.push(col1);
      });

      return res;
    }
  }, [rows]);

  const onClickCaptureSchema = (e) => {
    REClient_.client_()._captureStreamingSchema(props.datasetId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let featureGroupId = res?.result?.featureGroupId;

        StoreActions.listDatasets_([props.datasetId]);
        StoreActions.getProjectDatasets_(props.projectId);
        StoreActions.validateProjectDatasets_(props.projectId);
        StoreActions.resetSchemaChanged_();

        StoreActions.featureGroupsGetByProject_(props.projectId);
        StoreActions.schemaGetFileFeatureGroup_(props.projectId, featureGroupId, null);
        StoreActions.featureGroupsDescribe_(null, featureGroupId);
        if (props.projectId) {
          StoreActions.featureGroupsDescribe_(props.projectId, featureGroupId);
        }

        // Location.push('/'+PartsLink.dataset_schema+'/'+props.datasetId+(props.projectId ? ('/'+props.projectId) : ''));
        Location.push('/' + PartsLink.features_list + '/' + (props.projectId || '-') + '/' + featureGroupId);
      }
    });
  };

  //defaultSort={{field: 'date'}}
  return (
    <div style={{}}>
      <div style={style1}>
        <div
          style={{ marginBottom: '9px', fontSize: '14px', textAlign: 'center' }}
          css={`
            position: relative;
          `}
        >
          <div>Recently Received Data</div>
          <div
            css={`
              position: absolute;
              right: 0;
              top: 0;
            `}
          >
            <Button onClick={onClickCaptureSchema} type={'primary'} size={'small'}>
              Capture Streaming Schema
            </Button>
          </div>
        </div>
        <TableExt headersNatural showEmptyIcon={true} height={null} dataSource={rows} columns={columns} calcKey={(r1) => r1.id} />
      </div>
    </div>
  );
});

export default StreamingTestRecords;
