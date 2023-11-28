import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ViewFile.module.css');
const sd = require('../antdUseDark.module.css');

interface IViewFileProps {
  batchPredictionVersion?: string;
  fileTitle?: string;
  fileRaw?: string;
}

const ViewFile = React.memo((props: PropsWithChildren<IViewFileProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [fileData, setFileData] = useState([]);
  useEffect(() => {
    if (props?.batchPredictionVersion) {
      REClient_.client_().getBatchPredictionConnectorErrors(props?.batchPredictionVersion, (err, res) => {
        if (err) {
          REActions.addNotificationError(err);
        } else {
          setFileData(res != null ? [{ file: res }] : []);
        }
      });
    }
  }, [props.batchPredictionVersion]);

  useEffect(() => {
    if (props?.fileRaw) {
      setFileData([{ file: props?.fileRaw }]);
    }
  }, [props.fileRaw]);

  const columns = useMemo(() => {
    return [
      {
        title: props?.fileTitle || '',
        field: 'file',
        render: (text, row, index) => {
          const enters = (s1) => {
            if (s1 == null) {
              return s1;
            }
            if (_.isString(s1)) {
              if (s1.indexOf('\n')) {
                let ss = s1.split('\\n');
                return ss.map((s1, ind) => (
                  <div
                    key={'s' + ind}
                    css={`
                      margin-bottom: 12px;
                      line-height: 1.5;
                    `}
                  >
                    {s1}
                  </div>
                ));
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
              `}
            >
              {!Utils.isNullOrEmpty(row.file) && (
                <div
                  css={`
                    display: flex;
                    margin-top: 8px;
                  `}
                >
                  <div
                    css={`
                      white-space: normal;
                    `}
                  >
                    {enters(row.file)}
                  </div>
                </div>
              )}
              {Utils.isNullOrEmpty(row.file) && (
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
                    No Data
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
    ] as ITableExtColumn[];
  }, [props.fileTitle]);

  return (
    <div
      css={`
        height: 500px;
      `}
    >
      <TableExt isVirtual autoHeight separator1 showEmptyIcon={true} height={500} dataSource={fileData} columns={columns} calcKey={(r1) => r1?.id} />
    </div>
  );
});

export default ViewFile;
