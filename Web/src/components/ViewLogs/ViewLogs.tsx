import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import DateOld from '../DateOld/DateOld';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ViewLogs.module.css');
const sd = require('../antdUseDark.module.css');

interface IViewLogsProps {
  modelVersion?: string;
  featureGroupVersion?: string;
  isTrainingData?: boolean;
  msgRaw?: boolean;
  dataLogs?: any[];
}

const ViewLogs = React.memo((props: PropsWithChildren<IViewLogsProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let dd = props.dataLogs;
    if (dd != null && _.isArray(dd)) {
      if (_.isString(dd[0])) {
        setLogs(dd.map((s1) => ({ msg: s1 })));
      }
    }
  }, [props.dataLogs]);

  useEffect(() => {
    if (props.featureGroupVersion) {
      REClient_.client_().getMaterializationLogs(props.featureGroupVersion, true, true, (err, res) => {
        setLogs(res?.result ?? []);
      });
    }
  }, [props.featureGroupVersion]);

  useEffect(() => {
    if (props.modelVersion) {
      if (props.isTrainingData) {
        REClient_.client_().getTrainingDataLogs(props.modelVersion, (err, res) => {
          setLogs(res?.result?.logs?.map((s1) => ({ msg: s1 })) ?? []);
        });
      } else {
        REClient_.client_().getTrainingLogs(props.modelVersion, true, true, (err, res) => {
          setLogs(res?.result ?? []);
        });
      }
    }
  }, [props.modelVersion, props.isTrainingData]);

  const columns = useMemo(() => {
    return [
      {
        title: 'Message',
        field: 'msg',
        render: (text, row, index) => {
          const enters = (s1) => {
            if (s1 == null) {
              return s1;
            }

            if (_.isString(s1)) {
              if (s1.indexOf('\n')) {
                let ss = s1.split('\n');
                return ss.map((s1, ind) => <div key={'s' + ind}>{s1}</div>);
              } else {
                return s1;
              }
            } else {
              return s1;
            }
          };

          return (
            <div
              css={`
                padding: 8px 14px;
                font-size: 14px;
                font-weight: normal;
                white-space: normal;
              `}
            >
              {row.algorithm != null && (
                <div
                  css={`
                    display: flex;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    Algorithm:
                  </div>
                  <div> {row.algorithm} </div>
                </div>
              )}
              {row.stats?.start != null && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    Start:
                  </div>
                  <div>
                    <DateOld always date={row.stats?.start} />
                  </div>
                </div>
              )}
              {!Utils.isNullOrEmpty(row.stderr) && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    StdErr:
                  </div>
                  <div
                    css={`
                      color: red;
                    `}
                  >
                    {enters(row.stderr)}
                  </div>
                </div>
              )}
              {!Utils.isNullOrEmpty(row.stdout) && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    StdOut:
                  </div>
                  <div>{enters(row.stdout)}</div>
                </div>
              )}
              {row.exception?.type != null && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    Exception:
                  </div>
                  <div>{enters(row.exception?.type)}</div>
                </div>
              )}
              {row.exception?.value != null && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    Message:
                  </div>
                  <div>{enters(row.exception?.value)}</div>
                </div>
              )}
              {row.msg != null && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  {!props.msgRaw && (
                    <div
                      css={`
                        white-space: nowrap;
                        margin-right: 5px;
                      `}
                    >
                      Message:
                    </div>
                  )}
                  <div>{enters(row.msg)}</div>
                </div>
              )}
              {row.exception?.traceback != null && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    Stacktrace:
                  </div>
                  <div>{enters(row.exception?.traceback)}</div>
                </div>
              )}
              {row.stats?.end != null && (
                <div
                  css={`
                    display: flex;
                  `}
                >
                  <div
                    css={`
                      white-space: nowrap;
                      margin-right: 5px;
                    `}
                  >
                    End:
                  </div>
                  <div>
                    <DateOld always date={row.stats?.end} />
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
    ] as ITableExtColumn[];
  }, [props.msgRaw]);

  return (
    <div
      css={`
        height: 500px;
      `}
    >
      <TableExt isVirtual autoHeight separator1 showEmptyIcon={true} height={500} dataSource={logs} columns={columns} />
    </div>
  );
});

export default ViewLogs;
