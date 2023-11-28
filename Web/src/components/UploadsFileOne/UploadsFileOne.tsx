import * as React from 'react';
const s = require('./UploadsFileOne.module.css');
const sd = require('../antdUseDark.module.css');
import { connect } from 'react-redux';
import Constants from '../../constants/Constants';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import * as _ from 'lodash';
import cx from 'classnames';
import REActions from '../../actions/REActions';
import Reflux from 'reflux';
import $ from 'jquery';
import memoizeOne, { memoizeOneCurry, memoizeBind } from '../../libs/memoizeOne';
import * as Immutable from 'immutable';
import { PropsWithChildren, useMemo, useState, useEffect, useCallback, useContext, useRef } from 'react';
import REUploads_, { IFileUpload } from '../../api/REUploads';
import { calcDatasetById, DatasetLifecycleDesc } from '../../stores/reducers/datasets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PartsLink from '../NavLeft/PartsLink';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';

interface IUploadsFileOneProps {
  file?: IFileUpload;
}

const UploadsFileOne = React.memo((props: PropsWithChildren<IUploadsFileOneProps>) => {
  let status = null;
  let ds1 = calcDatasetById(undefined, props.file?.datasetId);
  if (ds1) {
    status = ds1.get('status');
    if (status) {
      status = DatasetLifecycleDesc[status];
    }
  }

  let uploadS = null;
  if (props.file?.actual != null && props.file?.total != null) {
    uploadS = '(' + Utils.prettyPrintNumber(props.file?.actual, 2) + ' / ' + Utils.prettyPrintNumber(props.file?.total, 2, false) + ')';
  }
  if (props.file?.error) {
    uploadS = <span style={{ color: 'darkred' }}>{props.file?.error}</span>;
  }

  let fileFinished = props.file?.actual != null && props.file?.total && props.file?.actual >= props.file?.total;
  let anyError = props.file?.error;

  const onClickRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (props.file?.uploaded !== true) {
      // if (props.file?.id) {
      //   REClient_.client_().cancelUpload(props.file?.id, (err, res) => {
      //     StoreActions.getProjectDatasets_(props.file?.projectId, (resP, ids) => {
      //       StoreActions.listDatasets_(ids);
      //     });
      //   });
      // }
      if (props.file?.datasetVersion) {
        REClient_.client_()._cancelDatasetUpload(props.file?.datasetVersion, (err, res) => {
          StoreActions.getProjectDatasets_(props.file?.projectId, (resP, ids) => {
            StoreActions.listDatasets_(ids);
          });
        });
      }
    }

    if (props.file?.datasetId) {
      REUploads_.client_().removeFileByDatasetId(props.file?.datasetId);
    } else {
      REUploads_.client_().removeFileById(props.file?.id);
    }
  };
  const onClickRoot = (e) => {
    if (props.file?.projectId) {
      Location.push('/' + PartsLink.project_dashboard + '/' + props.file?.projectId);
    }
  };

  if (fileFinished) {
    uploadS = null;
  }

  const hasDatasetId = !!props.file?.datasetId;

  let removeElem = (
    <span onClick={anyError || fileFinished ? onClickRemove : null} style={{ cursor: 'pointer', padding: '1px 4px' }}>
      <FontAwesomeIcon icon={['fas', 'times']} transform={{ size: 16, x: 0, y: 0 }} style={{ color: '#8798ad' }} />
    </span>
  );
  if (anyError || fileFinished) {
    //
  } else {
    if (hasDatasetId) {
      removeElem = (
        <ModalConfirm onConfirm={onClickRemove} title={`Do you want to stop this upload '${props.file?.name}'?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Stop Upload'} cancelText={'Cancel'} okType={'danger'}>
          {removeElem}
        </ModalConfirm>
      );
    } else {
      removeElem = null;
    }
  }

  return (
    <div onClick={onClickRoot} style={{ margin: '0 15px', padding: '0 8px', height: '55px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #8798ad' }} className={s.root}>
      <div style={{ marginRight: '8px', display: 'inline-block', width: '12px', height: '11px', backgroundColor: '#d8d8d8' }}>&nbsp;</div>
      <div style={{ flex: 1, color: fileFinished ? '#62bb4f' : '#d1e4f5' }}>
        <div style={{ width: '110px', display: 'flex' }}>
          <div className={sd.ellipsis}>
            {props.file?.name}
            <span style={{ padding: '0 0 0 6px' }}>-</span>
          </div>
        </div>
      </div>
      {status != null && <div style={{ marginLeft: '8px', color: Utils.colorA(0.7), fontWeight: 'normal' }}>{status}</div>}
      {uploadS != null && <div style={{ marginLeft: '8px', color: Utils.colorA(1), fontWeight: 'normal' }}>{uploadS}</div>}
      <div style={{ flex: '0 0 14px' }}>{removeElem}</div>
    </div>
  );
});

export default UploadsFileOne;
