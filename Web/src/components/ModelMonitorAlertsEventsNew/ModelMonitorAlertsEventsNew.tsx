import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import { useModelMonitor, useModelMonitorVersions, useMonitorsAll, useMonitorsEvents } from '../../api/REUses';
import CopyText from '../CopyText/CopyText';
import NanoScroller from '../NanoScroller/NanoScroller';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ModelMonitorAlertsEventsNew.module.css');
const sd = require('../antdUseDark.module.css');

const secondLineHH = 50;

interface IModelMonitorAlertsEventsNewProps {}

const ModelMonitorAlertsEventsNew = React.memo((props: PropsWithChildren<IModelMonitorAlertsEventsNewProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [modelMonitorVersion, setModelMonitorVersion] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let useModelMonitorVersion = paramsProp?.get('useModelMonitorVersion');
  if (useModelMonitorVersion === '' || useModelMonitorVersion === '-') {
    useModelMonitorVersion = null;
  }

  const modelMonitorId = paramsProp?.get('modelMonitorId');

  const monitorOne = useModelMonitor(modelMonitorId);
  const monitorVersionsList = useModelMonitorVersions(modelMonitorId);

  const eventsList = useMonitorsEvents(modelMonitorVersion);

  useEffect(() => {
    if (useModelMonitorVersion) {
      setModelMonitorVersion(useModelMonitorVersion);
      return;
    }

    if (!monitorOne) {
      setModelMonitorVersion(null);
      return;
    }

    setModelMonitorVersion(monitorOne?.latestMonitorModelVersion?.modelMonitorVersion ?? null);
  }, [monitorOne, useModelMonitorVersion]);

  const optionsVersions = useMemo(() => {
    return monitorVersionsList?.map((m1) => ({ label: m1.modelMonitorVersion, value: m1.modelMonitorVersion }));
  }, [monitorVersionsList]);

  const columnsEvents = useMemo(() => {
    return [
      {
        title: 'Name',
        field: 'name',
        render: (text, row, index) => {
          return (
            <span>
              {row.name}
              <CopyText
                css={`
                  opacity: 0.7;
                  margin-left: 15px;
                `}
              >
                {row.monitorAlertId}
              </CopyText>
            </span>
          );
        },
      },
      {
        title: 'Status',
        field: 'status',
        render: (text, row, index) => {
          return <span>{Utils.upperFirst(text, true)}</span>;
        },
      },
      {
        title: 'Alert Result',
        field: 'alertResult',
        render: (text, row, index) => {
          let replacedResult = text?.replace('_', ' ');
          return <span>{Utils.upperFirst(replacedResult, true)}</span>;
        },
      },
      {
        title: 'Description',
        field: 'conditionDescription',
        render: (text, row, index) => {
          return row.conditionDescription;
        },
      },
      // {
      //   title: 'Actions',
      //   noAutoTooltip: true,
      //   noLink: true,
      //   render: (text, row, index) => {
      //     return <span css={`display: flex; gap: 10px;`}>
      //       {/*<Button type={'default'} ghost onClick={onClickRun.bind(null, row.monitorAlertId)}>Run</Button>*/}
      //       {/*<Button type={'default'} ghost onClick={onClickEdit.bind(null, row.monitorAlertId)}>Edit</Button>*/}
      //       {/*<ModalConfirm onConfirm={onClickDelete.bind(null, row.monitorAlertId)} title={`Do you want to delete this alert'?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>*/}
      //       {/*  <Button type={'default'} danger ghost>Delete</Button>*/}
      //       {/*</ModalConfirm>*/}
      //     </span>;
      //   }
      // }
    ] as ITableExtColumn[];
  }, []);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const modelsList = useMonitorsAll(projectId, true);

  const optionsModels = useMemo(() => {
    return modelsList?.map((m1) => ({
      label: m1.name,
      value: m1.modelMonitorId,
      data: m1,
      search: m1.name,
    }));
  }, [modelsList]);

  let modelSelectValue = optionsModels?.find((p1) => p1.value === modelMonitorId) ?? null;

  const onChangeVersionUrl = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let mode = paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let projectPart = projectId;
      if (projectPart) {
        projectPart = '/' + projectPart;
      } else {
        projectPart = '';
      }

      Location.push('/' + mode + '/' + modelMonitorId + projectPart, undefined, Utils.processParamsAsQuery({ useModelMonitorVersion: optionSel?.value }, window.location.search));
    }
  };

  const onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let mode = paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let projectPart = projectId;
      if (projectPart) {
        projectPart = '/' + projectPart;
      } else {
        projectPart = '';
      }

      Location.push('/' + mode + '/' + optionSel.value + projectPart, undefined, Utils.processParamsAsQuery({ useModelMonitorVersion: null }, window.location.search));
    }
  };

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
      <div className={sd.titleTopHeaderAfter} style={{ margin: '20px', display: 'flex', justifyContent: 'flex-start' }}>
        <span>Alerts</span>
      </div>
      <div
        css={`
          display: flex;
          align-items: center;
          margin: 0 20px;
        `}
      >
        <span
          css={`
            font-size: 16px;
          `}
        >
          Monitor:
        </span>
        <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '240px', display: 'inline-block', fontSize: '12px' }}>
          <SelectExt value={modelSelectValue} options={optionsModels} onChange={onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
        </span>
        <span
          css={`
            font-size: 16px;
            margin-left: 15px;
          `}
        >
          Version:
        </span>
        <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '240px', display: 'inline-block', fontSize: '12px' }}>
          <SelectExt value={optionsVersions?.find((o1) => o1.value === modelMonitorVersion)} options={optionsVersions} onChange={onChangeVersionUrl} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
        </span>

        <span
          css={`
            flex: 1;
          `}
        ></span>
        <span>
          {/*<Link to={'/'+PartsLink.monitors_alert_add+'/'+modelMonitorId+'/'+projectId}>*/}
          {/*  <Button className={sd.detailbuttonblue} style={{ margin: '4px', }} type={'primary'}>Add Alert</Button>*/}
          {/*</Link>*/}
        </span>
      </div>
      <div
        css={`
          position: absolute;
          top: ${topAfterHeaderHH + secondLineHH}px;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <NanoScroller onlyVertical>
          <div
            css={`
              margin: 30px 20px;
            `}
          >
            <TableExt showEmptyIcon={true} dataSource={eventsList} columns={columnsEvents} />
          </div>
        </NanoScroller>
      </div>
    </div>
  );
});

export default ModelMonitorAlertsEventsNew;
