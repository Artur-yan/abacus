import Radio from 'antd/lib/radio';
import * as Diff from 'diff';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { useFeatureGroup, useFeatureGroupVersions } from '../../api/REUses';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import EditorElem from '../EditorElem/EditorElem';
import NanoScroller from '../NanoScroller/NanoScroller';
const s = require('./FeatureGroupHistory.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupHistoryProps {}

const FeatureGroupHistory = React.memo((props: PropsWithChildren<IFeatureGroupHistoryProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [compareWithVersion, setCompareWithVersion] = useState(paramsProp?.get('compareWithVersion'));

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-' || projectId === '') {
    projectId = null;
  }
  const featureGroupId = paramsProp?.get('featureGroupId');

  const featureGroupOne = useFeatureGroup(projectId, featureGroupId);
  const featureGroupVersions = useFeatureGroupVersions(featureGroupId);

  const compareWithVersionUsed = compareWithVersion ?? featureGroupVersions?.[1]?.featureGroupVersion;

  const versionRight = featureGroupVersions?.[0];
  const versionLeft = featureGroupVersions?.find((v1) => v1.featureGroupVersion === compareWithVersionUsed);

  const [leftSource, setLeftSource] = useState('');
  const [rightSource, setRightSource] = useState('');

  useEffect(() => {
    if (!versionLeft) {
      return;
    }
    REClient_.promises_()
      .describeFeatureGroupVersion(versionLeft?.featureGroupVersion)
      .then((res) => {
        setLeftSource(res?.result?.sql ?? res?.result?.functionSourceCode);
      });
  }, [versionLeft]);

  useEffect(() => {
    if (!versionRight) {
      return;
    }
    REClient_.promises_()
      .describeFeatureGroupVersion(versionRight?.featureGroupVersion)
      .then((res) => {
        setRightSource(res?.result?.sql ?? res?.result?.functionSourceCode);
      });
  }, [versionRight]);

  const onChangeRadioVersion = (e) => {
    let v1 = e.target.value;
    setCompareWithVersion(v1);

    Location.push('/' + paramsProp?.get('mode') + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, Utils.processParamsAsQuery({ compareWithVersion: v1 }, window.location.search));
  };

  const diffList = useMemo(() => {
    let diffList = [];
    featureGroupVersions?.some((v1, v1ind) => {
      if (v1ind === 0) {
        return;
      }

      let v0 = featureGroupVersions?.[0];

      let c0 = v0?.sql ?? v0?.functionSourceCode;
      let c1 = v1?.sql ?? v1?.functionSourceCode;
      let d1 = Diff.diffLines(c0 || '', c1 || '');

      let r1 = { version: v1.featureGroupVersion, added: 0, removed: 0 };
      d1?.some((d2) => {
        if (d2.added === true) {
          r1.added += d2.count ?? 0;
        }
        if (d2.removed === true) {
          r1.removed += d2.count ?? 0;
        }
      });
      diffList.push(r1);
    });
    return diffList as { version?; added?; removed? }[];
  }, [featureGroupVersions]);

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      `}
    >
      <div
        css={`
          position: absolute;
          top: 40px;
          left: 40px;
          right: 40px;
          bottom: 40px;
        `}
      >
        {/*// @ts-ignore */}
        <SplitPane
          css={`
            height: 100%;
          `}
          split={'vertical'}
          minSize={200}
          defaultSize={Utils.dataNum('expandsql_history', 300)}
          onChange={(v1) => {
            Utils.dataNum('expandsql_history', undefined, v1);
          }}
        >
          <div
            css={`
              font-size: 14px;
              position: absolute;
              top: 0;
              left: 0;
              right: 10px;
              bottom: 0;
            `}
          >
            <NanoScroller onlyVertical>
              <div
                css={`
                  padding-bottom: 8px;
                  border-bottom: 1px solid white;
                  margin-bottom: 15px;
                  text-align: center;
                `}
              >
                Feature Group Versions
              </div>

              <Radio.Group value={compareWithVersionUsed} style={{ width: '100%', color: 'white' }} onChange={onChangeRadioVersion}>
                {featureGroupVersions?.map((fgv1, fgv1ind) => {
                  let diff1 = diffList?.find((d1) => d1.version === fgv1.featureGroupVersion);
                  let diffElem;
                  if (diff1 != null) {
                    diffElem = (
                      <span
                        css={`
                          font-weight: 500;
                          font-size: 13px;
                          font-family: monospace;
                        `}
                      >
                        {diff1?.added > 0 && (
                          <div
                            css={`
                              color: green;
                            `}
                          >
                            ++{diff1?.added}
                          </div>
                        )}
                        {diff1?.removed > 0 && (
                          <div
                            css={`
                              color: red;
                            `}
                          >
                            --{diff1?.removed}
                          </div>
                        )}
                      </span>
                    );
                  }

                  return (
                    <Radio
                      value={fgv1.featureGroupVersion}
                      disabled={fgv1ind === 0}
                      css={`
                        ${fgv1ind === 0 ? '& .ant-radio { opacity: 0.3; } ' : ''} border-bottom: 1px solid rgba(255,255,255,0.3);
                        padding: 10px 10px 10px 5px;
                        margin-left: 5px;
                        width: 100%;
                      `}
                      key={'fgv' + fgv1.featureGroupVersion}
                    >
                      <div
                        css={`
                          color: white;
                          display: flex;
                        `}
                      >
                        <div
                          css={`
                            flex: 1;
                          `}
                        >
                          <div>
                            <CopyText>{fgv1.featureGroupVersion}</CopyText>
                          </div>
                          <div
                            css={`
                              margin-top: 4px;
                              opacity: 0.7;
                            `}
                          >
                            Created At: <DateOld always date={fgv1.createdAt} />
                          </div>
                          {diffElem}
                        </div>
                      </div>
                    </Radio>
                  );
                })}
              </Radio.Group>
            </NanoScroller>
          </div>
          <div
            css={`
              height: 100%;
            `}
          >
            <div
              css={`
                margin-bottom: 5px;
                padding-bottom: 10px;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <div>
                {versionLeft?.featureGroupVersion}
                <span
                  css={`
                    margin-left: 10px;
                  `}
                >
                  Created At: <DateOld always date={versionLeft?.createdAt} />
                </span>
              </div>
              <div
                css={`
                  margin: 0 20px;
                  opacity: 0.7;
                `}
              >
                vs
              </div>
              <div>
                <span
                  css={`
                    margin-right: 8px;
                  `}
                >
                  Last:
                </span>
                {versionRight?.featureGroupVersion}
                <span
                  css={`
                    margin-left: 10px;
                  `}
                >
                  Created At: <DateOld always date={versionRight?.createdAt} />
                </span>
              </div>
            </div>
            <AutoSizer disableWidth>{({ height }) => <EditorElem lineNumbers hideExpandFull height={height} readonly isDiff value={rightSource} valueOriginal={leftSource} />}</AutoSizer>
          </div>
        </SplitPane>
      </div>
    </div>
  );
});

export default FeatureGroupHistory;
