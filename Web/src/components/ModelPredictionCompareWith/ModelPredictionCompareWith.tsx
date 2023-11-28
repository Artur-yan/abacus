import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Popover from 'antd/lib/popover';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import DropFiles from '../DropFiles/DropFiles';
const s = require('./ModelPredictionCompareWith.module.css');
const sd = require('../antdUseDark.module.css');

export interface ICompareFilePredOne {
  id?: string;
  isUse?: boolean;
  filename?: string;
  size?: number;
  content?: any;
  columns?: string[];
}

interface IModelPredictionCompareWithProps {
  onFilesChanges?: (files: ICompareFilePredOne[]) => void;
  onFileDelete?: (id: string) => void;
  deploymentId?: string;
}

const ModelPredictionCompareWith = React.memo((props: PropsWithChildren<IModelPredictionCompareWithProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [filesList, setFilesList] = useState(null as ICompareFilePredOne[]);
  const refFiles = useRef<any>(null);

  const onChangeFileIsUse = (index, e) => {
    const v1 = e.target.checked;
    setFilesList((list) => {
      if (list[index]) {
        list = [...(list ?? [])];
        list[index] = { ...list[index] };
        list[index].isUse = v1;
      }
      return list;
    });
  };

  const onDropFiles = (filesList) => {
    if (filesList == null || filesList.length === 0) {
      return;
    }

    const pp = filesList.map((f1) => {
      return () =>
        new Promise((resolve) => {
          let fileFormat = 'CSV';
          let fn = f1.name?.toLowerCase();
          if (fileFormat) {
            if (_.endsWith(fn, '.xls') || _.endsWith(fn, '.xlsx')) {
              fileFormat = 'XLS';
            } else if (_.endsWith(fn, '.csv')) {
              fileFormat = 'CSV';
            } else if (_.endsWith(fn, '.tsv')) {
              fileFormat = 'TSV';
            }
          }

          REClient_.client_()._addPredictionFile(props.deploymentId, f1, f1.name, fileFormat, (err, res) => {
            if (err || !res?.success) {
              if (err) {
                REActions.addNotificationError(err);
              }

              resolve(null);
            } else {
              resolve(true);
            }
          });
        });
    });

    if (pp.length > 0) {
      const doWork = (index) => {
        if (index > pp.length - 1) {
          refreshFiles();
          return;
        }

        let p1 = pp[index];
        p1?.().then((res) => {
          setTimeout(() => {
            doWork(index + 1);
          }, 50);
        });
      };
      doWork(0);
    }
  };

  const onClickAddFile = (e) => {
    refFiles.current?.openDialog();
  };

  const refreshFiles = () => {
    REClient_.client_()._getPredictionFiles(props.deploymentId, (err, res) => {
      if (err || !res?.success) {
        setFilesList(null);
      } else {
        let list = res?.result?.map((f1) => {
          return {
            isUse: true,
            id: f1.fileId,
            filename: f1.fileName,
            size: 0,
            content: f1?.data?.data,
            columns: f1?.data?.columns,
          } as ICompareFilePredOne;
        });

        setFilesList(list);
      }
    });
  };

  useEffect(() => {
    setFilesList(null);
    refreshFiles();
  }, [props.deploymentId]);

  useEffect(() => {
    let ff = filesList;
    if (ff != null && ff.length === 0) {
      ff = null;
    }

    props.onFilesChanges?.(ff);
  }, [filesList]);

  const onClickRemoveFile = (f1id) => {
    REClient_.client_()._deletePredictionFiles(props.deploymentId, f1id, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        props.onFileDelete?.(f1id);
        refreshFiles();
      }
    });
  };

  const windowOverlay = useMemo(() => {
    return (
      <div
        css={`
          color: white;
          width: 300px;
        `}
      >
        <DropFiles ref={refFiles} useBorder onDrop={onDropFiles} accepts={['.csv', '.xls', '.xlsx']}>
          <div>
            <div
              css={`
                text-align: center;
              `}
            >
              Files
            </div>
            <div
              css={`
                margin: 3px 20px 8px;
                opacity: 0.7;
                font-size: 13px;
                text-align: center;
              `}
            >
              Drag a file here to add it
            </div>
            <div
              css={`
                padding: 10px;
                border: 1px solid ${Utils.colorA(0.2)};
                border-radius: 4px;
              `}
            >
              {filesList?.map((f1, f1ind) => {
                return (
                  <div
                    key={'file_' + f1ind}
                    css={`
                      display: flex;
                      align-items: center;
                      padding: 6px 6px;
                      border-bottom: 1px dotted ${f1ind < filesList?.length - 1 ? Utils.colorAall(0.6) : 'transparent'};
                    `}
                  >
                    <div>
                      <Checkbox checked={f1.isUse === true} onChange={onChangeFileIsUse.bind(null, f1ind)} />
                    </div>
                    <div
                      css={`
                        flex: 1;
                        margin-left: 5px;
                      `}
                      className={sd.ellipsis}
                    >
                      {f1.filename}
                    </div>
                    <div
                      css={`
                        margin-left: 8px;
                        cursor: pointer;
                      `}
                      onClick={onClickRemoveFile.bind(null, f1.id)}
                    >
                      <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTimes').faTimes} transform={{ size: 18, x: 0, y: 0 }} css={``} />
                    </div>
                  </div>
                );
              })}
              {(filesList == null || filesList.length === 0) && (
                <div
                  css={`
                    margin: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                  `}
                >
                  <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faBoxOpen').faBoxOpen} transform={{ size: 20, x: 0, y: 0 }} css={``} />
                  <span
                    css={`
                      opacity: 0.8;
                      font-size: 14px;
                      margin-top: 4px;
                    `}
                  >
                    Empty
                  </span>
                </div>
              )}
            </div>
          </div>
        </DropFiles>

        <div
          css={`
            margin-top: 15px;
          `}
        >
          <Button
            onClick={onClickAddFile}
            css={`
              width: 100%;
              height: 26px;
              line-height: 1em;
            `}
            type={'primary'}
          >
            Add File...
          </Button>
        </div>
      </div>
    );
  }, [filesList]);

  const popupContainerForMenu = (node) => document.getElementById('body2');

  return (
    <Popover getPopupContainer={popupContainerForMenu} overlayClassName={sd.popback} content={windowOverlay} trigger={['click']} title="Compare" placement={'bottom'}>
      <span
        css={`
          cursor: pointer;
        `}
      >
        Compare
        <FontAwesomeIcon
          icon={require('@fortawesome/pro-regular-svg-icons/faAngleDown').faAngleDown}
          transform={{ size: 16, x: 0, y: 0 }}
          css={`
            margin-left: 8px;
          `}
        />
      </span>
    </Popover>
  );
});

export default ModelPredictionCompareWith;
