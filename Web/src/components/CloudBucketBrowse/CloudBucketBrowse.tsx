import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useState } from 'react';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
const s = require('./CloudBucketBrowse.module.css');
const sd = require('../antdUseDark.module.css');
const { Option } = Select;

export interface ICloudBucketBrowseProps {
  style?: CSSProperties;
  onlyBucket?: boolean;
  showPermissions?: boolean;
  onBucketSel?: (bucket: { bucket: string; verified: boolean; writePermission: boolean }) => void;
  onPathChange?: (path?: string) => void;
  onChange?: (v1: any) => void;
  startsWith?: string;
  onlyWithWritePermissions?: boolean;
  bucketSel?: any;
  bucketPath?: any;
  onBucketObjectChanged?: (v1: any) => void;
}

const CloudBucketBrowse = React.memo((props: PropsWithChildren<ICloudBucketBrowseProps>) => {
  const [bucketList, setBucketList] = useState(null as { bucket: string; verified: boolean; writePermission: boolean }[]);

  const startsWith = Utils.isNullOrEmpty(props.startsWith) ? null : props.startsWith;
  const onChangeBucketSel = (v1) => {
    props.onBucketSel?.(v1);
    props.onBucketObjectChanged?.(bucketList?.find((b1) => b1.bucket === v1));

    setTimeout(() => {
      props.onChange?.(null);
    }, 0);
  };
  const selectBefore = (
    <Select value={props.bucketSel} notFoundContent={'No Service Configured With Write Permissions'} onChange={onChangeBucketSel} className="select-before" style={{ minWidth: '240px', width: props.onlyBucket ? '100%' : '' }}>
      {bucketList
        ?.filter((b1) => (props.onlyWithWritePermissions === true ? b1.writePermission : true))
        .filter((b1) => (startsWith == null ? true : _.startsWith(b1.bucket, startsWith)))
        .map((b1, b1ind) => {
          return (
            <Option key={'' + b1.bucket + '_' + b1ind} value={b1.bucket}>
              {b1.bucket}
            </Option>
          );
        })}
    </Select>
  );
  const bucketSel = props.bucketSel && bucketList ? bucketList?.find((b1) => b1.bucket === props.bucketSel) : null;

  const onChangePath = (e) => {
    let v1 = e.target.value;
    props.onPathChange?.(v1);

    setTimeout(() => {
      props.onChange?.(null);
    }, 0);
  };

  const [bucketsListIsProcessing, setBucketsListIsProcessing] = useState(false);
  let retrieveBuckets = (cbFinish: (err, res) => void) => {
    REClient_.client_().listExternalBuckets((errL, resL) => {
      if (!errL && resL?.result) {
        cbFinish?.(null, resL?.result);
      } else {
        cbFinish?.(errL || 'Error', null);
      }
    });
  };
  const memBuckets = (doCall = false) => {
    if (bucketList == null) {
      if (bucketsListIsProcessing) {
        return null;
      } else {
        if (doCall) {
          retrieveBuckets((err, res) => {
            if (!err && res) {
              setBucketList(res || []);
              setBucketsListIsProcessing(false);
            }
          });
        }
      }
    } else {
      return bucketList;
    }
  };

  useEffect(() => {
    memBuckets(true);
  }, []);

  return (
    <div style={props.style ?? {}}>
      {props.onlyBucket && selectBefore}
      {!props.onlyBucket && <Input addonBefore={selectBefore} value={props.bucketPath} onChange={onChangePath} />}

      {props.showPermissions && bucketSel && (
        <div style={{ fontSize: '12px', textAlign: 'center', color: Utils.colorA(0.6), lineHeight: 2 }}>
          <span>Verified:&nbsp;{bucketSel.verified ? 'True' : 'False'}</span>
          <span style={{ marginLeft: '20px' }}>Write Perm.:&nbsp;{bucketSel.writePermission ? 'True' : 'False'}</span>
        </div>
      )}
    </div>
  );
});

export default CloudBucketBrowse;
