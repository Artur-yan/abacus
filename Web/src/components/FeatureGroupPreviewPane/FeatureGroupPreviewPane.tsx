import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { useDebounce, useFeatureGroup } from '../../api/REUses';
import NanoScroller from '../NanoScroller/NanoScroller';
const s = require('./FeatureGroupPreviewPane.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupPreviewPaneProps {
  height?: number;
}

const FeatureGroupPreviewPane = React.memo((props: PropsWithChildren<IFeatureGroupPreviewPaneProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [tableName, setTableName] = useState('');
  const [FGList, setFGList] = useState(null);
  const [FGSel, setFGSel] = useState(null);

  const onChangeTableName = (e) => {
    setTableName(e.target.value ?? '');
  };

  const tableNameDebounce = useDebounce(tableName, 200);

  const tableNameLastCallUsed = useRef(null);
  useEffect(() => {
    if (Utils.isNullOrEmpty(tableNameDebounce)) {
      tableNameLastCallUsed.current = null;
      setFGList(null);
    } else {
      REClient_.client_()._listFeatureGroupsDashboard(null, 5, null, tableNameDebounce, null, (err, res) => {
        setFGList(res?.result ?? null);
      });
    }
  }, [tableNameDebounce]);

  const onClickFG = (featureGroupId, e) => {
    setFGSel(featureGroupId);
  };

  const featureGroupOne = useFeatureGroup(null, FGSel);

  const featuresList = useMemo(() => {
    let res = featureGroupOne?.features?.map((f1) => f1);
    return res;
  }, [featureGroupOne]);

  return (
    <div
      css={`
        height: ${props.height ?? 0}px;
        color: white;
        font-size: 15px;
        position: relative;
      `}
    >
      <NanoScroller onlyVertical>
        <div
          css={`
            text-align: center;
          `}
        >
          Preview Feature Group
        </div>
        <div
          css={`
            margin-top: 15px;
          `}
        >
          <Input placeholder={'TableName'} value={tableName} onChange={onChangeTableName} />
        </div>
        <div
          css={`
            margin-top: 10px;
          `}
        >
          {FGList?.map((fg1) => {
            return (
              <div
                key={'ff' + fg1.featureGroupId}
                css={`
                  margin-bottom: 5px;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.17);
                  padding-bottom: 5px;
                `}
              >
                <div
                  css={`
                    font-size: 14px;
                  `}
                  onClick={onClickFG.bind(null, fg1.featureGroupId)}
                  className={sd.ellipsis + ' ' + sd.linkBlue}
                >
                  {fg1.tableName}
                </div>
              </div>
            );
          })}
        </div>

        <div
          css={`
            margin-top: 20px;
          `}
        >
          <div>
            <span
              css={`
                opacity: 0.7;
              `}
            >
              Selected:{' '}
            </span>
            {featureGroupOne?.tableName}
          </div>
          <div
            css={`
              margin: 10px;
            `}
          >
            {featuresList?.map((f1, f1ind) => {
              return (
                <div
                  key={'feat' + f1.name + f1ind}
                  css={`
                    margin-top: 7px;
                  `}
                >
                  <div>{f1.name}</div>
                  <div
                    css={`
                      opacity: 0.7;
                      font-size: 14px;
                    `}
                  >
                    <div>{f1.featureType}</div>
                    <div>{f1.dataType}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </NanoScroller>
    </div>
  );
});

export default FeatureGroupPreviewPane;
