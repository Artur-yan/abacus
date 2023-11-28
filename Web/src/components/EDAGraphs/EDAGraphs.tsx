import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import classNames from 'classnames';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useRef } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useEdaGraphsListAll, usePythonFunctionsList } from '../../api/REUses';
import Constants from '../../constants/Constants';
import { PythonFunctionTypeParam } from '../../stores/reducers/pythonFunctions';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const styles = require('./EDAGraphs.module.css');
const stylesDark = require('../antdUseDark.module.css');
const { confirm } = Modal;

interface IEDAGraphsProps {}

const EDAGraphs = React.memo((props: PropsWithChildren<IEDAGraphsProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));

  const [ignoredRefreshList, forceUpdateRefreshList] = useReducer((x) => x + 1, 0);
  const editNameRef = useRef('');
  const createNameRef = useRef('');

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-' || projectId === '') {
    projectId = null;
  }

  let edaId = paramsProp?.get('edaId');
  if (edaId === '-' || edaId === '') {
    edaId = null;
  }

  const edaList = useEdaGraphsListAll(projectId, ignoredRefreshList);
  const isRefreshing = edaList == null;

  const onClickDeleteBatchPred = (graphDashboardId, e) => {
    REClient_.client_().deleteGraphDashboard(graphDashboardId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        forceUpdateRefreshList();
      }
    });
  };

  const onCreatePlot = async (row) => {
    confirm({
      title: 'Create New Plot',
      okText: 'Create',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>Name:</div>
          <Input
            style={{ marginTop: 8 }}
            defaultValue={row?.name}
            onChange={(e) => {
              createNameRef.current = e.target.value;
            }}
          />
        </div>
      ),
      onOk: async () => {
        try {
          const response = await REClient_.promises_().createGraphDashboard(projectId, createNameRef.current, []);
          if (!response?.success || response?.error) {
            throw new Error(response?.error);
          }
          forceUpdateRefreshList();
          Location.push('/' + PartsLink.exploratory_data_analysis_graphs_one + '/' + projectId, undefined, `graphDashboardId=${encodeURIComponent(response?.result?.graphDashboardId || '')}`);
        } catch (error) {
          REActions.addNotificationError(error?.message || Constants.errorDefault);
        }
      },
      onCancel: () => {},
    });
  };

  const onEditPlotName = async (row) => {
    confirm({
      title: 'Rename Plot',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{`Current Name: "${row?.name}"`}</div>
          <Input
            style={{ marginTop: 8 }}
            defaultValue={row?.name}
            onChange={(e) => {
              editNameRef.current = e.target.value;
            }}
          />
        </div>
      ),
      onOk: async () => {
        try {
          const getPlotResponse = await REClient_.promises_().describeGraphDashboard(row?.graphDashboardId);
          if (!getPlotResponse?.success || getPlotResponse?.error) {
            throw new Error(getPlotResponse?.error);
          }
          const pythonFunctionIds = getPlotResponse?.result?.pythonFunctionIds || [];
          const response = await REClient_.promises_().updateGraphDashboard(row?.graphDashboardId, editNameRef.current, pythonFunctionIds);
          if (!response?.success || response?.error) {
            throw new Error(response?.error);
          }
          forceUpdateRefreshList();
        } catch (error) {
          REActions.addNotificationError(error?.message || Constants.errorDefault);
        }
      },
      onCancel: () => {},
    });
  };

  const columns = useMemo(() => {
    return [
      {
        noAutoTooltip: true,
        title: 'ID',
        field: 'graphDashboardId',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
        isLinked: true,
        width: 130,
      },
      {
        noAutoTooltip: true,
        title: 'Created At',
        field: 'createdAt',
        render: (text) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 240,
      },
      {
        title: 'Name',
        field: 'name',
        render: (text, row, index) => {
          return <span>{text}</span>;
        },
      },
      {
        noAutoTooltip: true,
        title: 'Actions',
        render: (text, row, index) => {
          return (
            <span
              css={`
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
              `}
            >
              <Link forceSpanUse usePointer to={['/' + PartsLink.exploratory_data_analysis_graphs_one + '/' + projectId, `plots=1&graphDashboardId=${encodeURIComponent(row?.graphDashboardId || '')}`]}>
                <Button type={'primary'}>Plots</Button>
              </Link>
              <Button onClick={() => onEditPlotName(row)} ghost>
                Edit
              </Button>
              <ModalConfirm
                onConfirm={onClickDeleteBatchPred.bind(null, row?.graphDashboardId)}
                title={`Do you want to delete the EDA Graph?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Delete'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button danger ghost>
                  Delete
                </Button>
              </ModalConfirm>
            </span>
          );
        },
        width: 280,
      },
    ] as ITableExtColumn[];
  }, []);

  let tableHH = (hh) => (
    <RefreshAndProgress isRelative={hh == null} isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
      <TableExt showEmptyIcon={true} height={hh} dataSource={edaList} columns={columns} />
    </RefreshAndProgress>
  );

  let table = null;
  table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH)}</AutoSizer>;

  const pythonFunctionsList = usePythonFunctionsList(PythonFunctionTypeParam.PLOTLY_FIG);
  const plotsFuncDisabled = !pythonFunctionsList?.length || pythonFunctionsList == null;

  const createNewDashButton = useMemo(() => {
    let res = (
      <Button disabled={plotsFuncDisabled} type={'primary'} style={{ height: '30px', padding: '0 16px' }} onClick={plotsFuncDisabled ? undefined : onCreatePlot}>
        Create New
      </Button>
    );

    if (plotsFuncDisabled) {
      res = <TooltipExt title={`Create a Function to Generate Plot before`}>{res}</TooltipExt>;
    }

    return res;
  }, [pythonFunctionsList, plotsFuncDisabled]);

  return (
    <div className={classNames(stylesDark.absolute, stylesDark.table)} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, margin: 25 }}>
      <div
        className={stylesDark.titleTopHeaderAfter}
        css={`
          display: flex;
          align-items: center;
          height: ${topAfterHeaderHH}px;
        `}
      >
        <span>
          Exploratory Data Analysis - Plots
          <HelpIcon id={'eda_graphs_title'} style={{ marginLeft: 4 }} />
        </span>
        <span
          css={`
            flex: 1;
          `}
        ></span>
        <span>{projectId != null && createNewDashButton}</span>
      </div>
      {table}
    </div>
  );
});

export default EDAGraphs;
