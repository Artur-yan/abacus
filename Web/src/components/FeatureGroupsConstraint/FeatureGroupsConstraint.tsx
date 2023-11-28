import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import monitoring, { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import REClient_ from '../../api/REClient';
import { useFeatureGroup, useFeatureGroupVersions, useMonitorsAll } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import CopyText from '../CopyText/CopyText';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./FeatureGroupsConstraint.module.css');
const sd = require('../antdUseDark.module.css');

const secondLineHH = 50;

export const OPTypesList = [
  {
    label: '>',
    operator: '>',
  },
  {
    label: '>=',
    operator: '>=',
  },
  {
    label: '=',
    operator: '=',
  },
  {
    label: '<=',
    operator: '<=',
  },
  {
    label: '<',
    operator: '<',
  },
];

interface IModelMonitorAlertsNewProps {}

const FeatureGroupsConstraint = React.memo((props: PropsWithChildren<IModelMonitorAlertsNewProps>) => {
  const { paramsProp, authUser, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredAuto, forceUpdateAuto] = useReducer((x) => x + 1, 0);
  const [featureGroupConstraintsList, setFeatureGroupConstraintsList] = useState([]);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let featureGroupId = paramsProp?.get('featureGroupId');
  if (featureGroupId === '-') {
    featureGroupId = null;
  }
  const featureOne = useFeatureGroup(projectId, featureGroupId);

  const onClickEdit = (index, e) => {
    e.stopPropagation();
    e.preventDefault();

    Location.push('/' + PartsLink.feature_groups_constraint_add + '/' + (projectId ?? '-') + '/' + featureGroupId, undefined, `constraintEdit=${index}`);
  };

  const onClickDelete = (constraintId, e) => {
    e.stopPropagation();
    e.preventDefault();
    REClient_.client_().setProjectFeatureGroupConfig(featureGroupId, projectId, { type: 'CONSTRAINTS', constraints: [] }, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        forceUpdateAuto();
      }
    });
  };

  const columnsConstraint = useMemo(() => {
    return [
      {
        title: 'Name',
        field: 'name',
      },
      {
        title: 'OP',
        field: 'operator',
      },
      {
        title: 'Constant',
        field: 'constant',
      },
      {
        title: 'Code',
        field: 'code',
      },
      {
        title: 'Enforcement',
        field: 'enforcement',
      },
      {
        title: 'Penalty',
        field: 'penalty',
      },
      {
        title: 'Actions',
        noAutoTooltip: true,
        noLink: true,
        render: (text, row, index) => {
          return (
            <span
              css={`
                display: flex;
                gap: 10px;
              `}
            >
              <Button type={'default'} ghost onClick={onClickEdit.bind(null, index)}>
                Edit
              </Button>
              <ModalConfirm onConfirm={onClickDelete.bind(null, index)} title={`Do you want to delete this constraint'?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>
                <Button type={'default'} danger ghost>
                  Delete
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ] as ITableExtColumn[];
  }, []);

  useEffect(() => {
    let constraints = [];

    if (featureOne?.projectConfig?.constraints?.length > 0) {
      featureOne?.projectConfig?.constraints?.map((item) => {
        constraints.push({ name: featureOne?.name, ...item });
      });
    }
    setFeatureGroupConstraintsList(constraints);
  }, [projectId, featureOne]);

  const calcKey = useCallback((row) => {
    return row.constraintId;
  }, []);

  const calcLink = useCallback(
    (row) => {
      let p1 = '';
      if (projectId) {
        p1 = '/' + projectId;
      }
      return ['/' + PartsLink.feature_group_detail + p1 + '/' + featureGroupId];
    },
    [projectId],
  );

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
        <span>Constraint</span>
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
            flex: 1;
          `}
        ></span>
        <span>
          <Link to={'/' + PartsLink.feature_groups_constraint_add + '/' + projectId + '/' + featureGroupId}>
            <Button disabled={featureGroupConstraintsList?.length > 0} style={{ margin: '4px' }} type={'primary'}>
              Add Constraint
            </Button>
          </Link>
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
        <RefreshAndProgress style={{ margin: '30px 20px' }}>
          <NanoScroller onlyVertical>
            <TableExt showEmptyIcon={true} dataSource={featureGroupConstraintsList} columns={columnsConstraint} calcKey={calcKey} calcLink={calcLink} />
          </NanoScroller>
        </RefreshAndProgress>
      </div>
    </div>
  );
});

export default FeatureGroupsConstraint;
