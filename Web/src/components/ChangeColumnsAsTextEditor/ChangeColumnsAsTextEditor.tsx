import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import Select from 'antd/lib/select';
import Switch from 'antd/lib/switch';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import databaseConnectorObjectSchema from '../../stores/reducers/databaseConnectorObjectSchema';
import datasets from '../../stores/reducers/datasets';
import { memProjectById } from '../../stores/reducers/projects';
import EditorElem from '../EditorElem/EditorElem';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./ChangeColumnsAsTextEditor.module.css');
const sd = require('../antdUseDark.module.css');
const { confirm } = Modal;

interface IChangeColumnsAsTextEditorProps {
  useEditor?: boolean;
}

const ChangeColumnsAsTextEditor = React.memo(
  React.forwardRef((props: PropsWithChildren<IChangeColumnsAsTextEditorProps>, ref: any) => {
    const { databaseConnectorObjectSchemaParam, datasetsParam, projectsParam, paramsProp, authUser } = useSelector((state: any) => ({
      paramsProp: state.paramsProp,
      authUser: state.authUser,
      databaseConnectorObjectSchemaParam: state.databaseConnectorObjectSchema,
      projectsParam: state.projects,
      datasetsParam: state.datasets,
    }));

    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

    const [columnsValue, setColumnsValue] = useState(null);
    const [queryArgs, setQueryArgs] = useState(null);
    const [sqlQueryValue, setSqlQueryValue] = useState(null);
    const [useSqlQuery, setUseSqlQuery] = useState(null);
    const refSqlQuery = useRef(null);

    let projectId = paramsProp?.get('projectId');
    if (projectId === '-') {
      projectId = null;
    }

    const datasetId = paramsProp?.get('datasetId');
    const isView = paramsProp?.get('view');
    const fromScreen = paramsProp?.get('fromScreen');
    const fromScreenIsDatasetDetail = fromScreen === 'datasetDetail';

    useEffect(() => {
      memProjectById(projectId, true);
    }, [projectsParam, projectId]);
    const foundProject1 = useMemo(() => {
      return memProjectById(projectId, false);
    }, [projectsParam, projectId]);

    useEffect(() => {
      if (!datasetId) {
        return;
      }
      datasets.memDatasetListCall(true, undefined, [datasetId]);
    }, [datasetId, datasetsParam]);
    const datasetFound1 = useMemo(() => {
      if (!datasetId) {
        return;
      }

      let res = datasets.memDatasetListCall(false, undefined, [datasetId]);
      return Object.values(res ?? {})?.[0];
    }, [datasetId, datasetsParam]);

    // @ts-ignore
    const databaseConnectorId = datasetFound1?.get('databaseConnectorId');
    // @ts-ignore
    const dbObjectName = datasetFound1?.get('dataSource');
    useEffect(() => {
      if (useSqlQuery !== false) {
        return;
      }
      if (!databaseConnectorId || !dbObjectName) {
        return;
      }

      databaseConnectorObjectSchema.memDatabaseConnectorObjectSchema(true, databaseConnectorId, dbObjectName, undefined);
    }, [databaseConnectorId, dbObjectName, databaseConnectorObjectSchemaParam, useSqlQuery]);
    const dbConnectorOne = useMemo(() => {
      if (useSqlQuery !== false) {
        return;
      }
      if (!databaseConnectorId || !dbObjectName) {
        return;
      }
      return databaseConnectorObjectSchema.memDatabaseConnectorObjectSchema(false, databaseConnectorId, dbObjectName, undefined);
    }, [databaseConnectorId, dbObjectName, databaseConnectorObjectSchemaParam, useSqlQuery]);

    const allColumns = useMemo(() => {
      if (dbConnectorOne != null) {
        if (_.isArray(dbConnectorOne)) {
          return dbConnectorOne;
        } else {
          return [];
        }
      }
    }, [dbConnectorOne]);

    useEffect(() => {
      if (datasetFound1 == null) {
        return;
      }

      // @ts-ignore
      let sqlQuery = datasetFound1?.get('rawQuery') ?? '';
      setSqlQueryValue(sqlQuery);

      setUseSqlQuery(!Utils.isNullOrEmpty(sqlQuery));

      // @ts-ignore
      let columns = datasetFound1?.get('columns') ?? '';
      if (columns != null && _.isString(columns)) {
        columns = columns.split(/[, \n\r]/).filter((v1) => !Utils.isNullOrEmpty(v1));
      } else if (!_.isArray(columns)) {
        columns = [];
      }
      setColumnsValue(columns);

      // @ts-ignore
      let queryArguments = datasetFound1?.get('queryArguments') ?? '';
      setQueryArgs(queryArguments);
    }, [datasetFound1]);

    const onChangeSqlQueryValue = (name, value) => {
      setSqlQueryValue(value);
    };

    const onChangeValue = (name, value) => {
      setColumnsValue(value);
    };

    useImperativeHandle(ref, () => ({}), []);

    const columnOptions = useMemo(() => {
      let columnOptions = [];
      if (allColumns) {
        allColumns?.some((p1) => {
          columnOptions.push(
            <Select.Option value={p1} key={p1}>
              {p1}
            </Select.Option>,
          );
        });
      }
      return columnOptions;
    }, [allColumns]);

    const onChangeQueryArgs = (name, value) => {
      setQueryArgs(value);
    };

    const onChangeColumnsOptions = (value) => {
      setColumnsValue(value);
    };

    const onClickFormat = (e) => {
      refSqlQuery.current?.doFormat();
    };

    const onClickSave = (e) => {
      const doAllWork = (columns: string, queryArgs: string, sqlQuery: string) => {
        if (datasetId) {
          const doWork = (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              StoreActions.listDatasetsVersions_(datasetId, () => {
                StoreActions.getProjectsList_();
                StoreActions.listDatasets_([datasetId]);
                if (projectId) {
                  StoreActions.getProjectsById_(projectId);
                  StoreActions.listModels_(projectId);
                  StoreActions.getProjectDatasets_(projectId);
                  StoreActions.validateProjectDatasets_(projectId);
                }

                StoreActions.refreshDoDatasetAll_(datasetId, projectId);
              });

              if (projectId == null) {
                Location.push('/' + PartsLink.dataset_detail + '/' + datasetId);
              } else if (fromScreenIsDatasetDetail) {
                Location.push('/' + PartsLink.dataset_detail + '/' + datasetId + '/' + projectId);
              } else {
                Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
              }
            }
          };

          REClient_.client_().importDatasetVersionFromDatabaseConnector(datasetId, null, !useSqlQuery ? columns : '', !useSqlQuery ? queryArgs : '', useSqlQuery ? sqlQuery : '', (err, res) => {
            doWork(err, res);
          });
        }
      };

      doAllWork(columnsValue, queryArgs, sqlQueryValue);
    };

    return (
      <div
        css={`
          margin: 0 30px;
        `}
      >
        <div
          css={`
            max-width: 900px;
            margin: 30px auto;
          `}
        >
          <div
            css={`
              font-family: Matter;
              font-size: 24px;
              line-height: 1.33;
              color: #ffffff;
              margin-bottom: 20px;
              text-align: center;
            `}
          >
            <div
              css={`
                margin-bottom: 10px;
              `}
            >
              <span>Dataset:</span>
              <span
                css={`
                  margin-left: 5px;
                `}
              >
                {(datasetFound1 as any)?.getIn(['dataset', 'name'])}
              </span>
            </div>
            {!isView && (
              <div
                css={`
                  font-size: 18px;
                  opacity: 0.8;
                `}
              >
                Configure before reading dataset
              </div>
            )}
          </div>

          <FormExt layout={'vertical'}>
            {
              <Form.Item
                css={`
                  .ant-switch:not(.ant-switch-checked) {
                    background-color: #848484;
                  }
                `}
                name={'useSqlQuery'}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Use Raw SQL Query:
                    <HelpIcon id={'dataset_upload_sql_query'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Switch
                  checked={useSqlQuery}
                  onChange={(v1) => {
                    setUseSqlQuery(v1);
                  }}
                />
              </Form.Item>
            }

            {!props.useEditor && !useSqlQuery && (
              <Form.Item shouldUpdate={true} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Columns:</span>}>
                <Select key={'selectedColumns'} mode="tags" value={columnsValue} onChange={onChangeColumnsOptions} tokenSeparators={[',']}>
                  {columnOptions}
                </Select>
              </Form.Item>
            )}
            {props.useEditor && !useSqlQuery && (
              <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Columns:</span>}>
                <EditorElem showSmallHelp listProperties={allColumns} value={columnsValue} height={300} onChange={onChangeValue} />
              </Form.Item>
            )}

            {useSqlQuery && (
              <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>SQL Query:</span>}>
                <EditorElem ref={refSqlQuery} readonly={!!isView} value={sqlQueryValue} height={300} onChange={onChangeSqlQueryValue} />
              </Form.Item>
            )}

            {!useSqlQuery && (
              <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Query Arguments:</span>}>
                <EditorElem height={50} list={dbConnectorOne ?? Utils.emptyStaticArray()} value={queryArgs} onChange={onChangeQueryArgs} />
              </Form.Item>
            )}

            {!isView && (
              <div
                css={`
                  margin-top: 20px;
                  display: flex;
                `}
              >
                {Constants.flags.show_format_sql && (
                  <Button
                    type={'default'}
                    ghost
                    onClick={onClickFormat}
                    css={`
                      width: 120px;
                      margin-right: 10px;
                    `}
                  >
                    Format SQL
                  </Button>
                )}
                <Button
                  type={'primary'}
                  onClick={onClickSave}
                  css={`
                    flex: 1;
                  `}
                >
                  Read New Version
                </Button>
              </div>
            )}
          </FormExt>
        </div>
      </div>
    );
  }),
);

export default ChangeColumnsAsTextEditor;
