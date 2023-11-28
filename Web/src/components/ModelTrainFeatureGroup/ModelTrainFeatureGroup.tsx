import Button from 'antd/lib/button';
import Radio from 'antd/lib/radio';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import HelpIcon from '../HelpIcon/HelpIcon';
const s = require('./ModelTrainFeatureGroup.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelTrainFeatureGroupProps {
  height?: number;
  showTitle?: boolean;
}

const ModelTrainFeatureGroup = React.memo((props: PropsWithChildren<IModelTrainFeatureGroupProps>) => {
  const { useCasesParam, projectsParam, paramsProp, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
    useCasesParam: state.useCases,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [groupSelIdByDatasetType, setGroupSelIdByDatasetType] = useState({});

  const projectId = paramsProp?.get('projectId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const useCase1 = foundProject1?.useCase;
  useEffect(() => {
    memUseCasesSchemasInfo(true, useCase1);
  }, [useCasesParam, useCase1]);
  const useCaseInfo = useMemo(() => {
    return memUseCasesSchemasInfo(false, useCase1);
  }, [useCasesParam, useCase1]);

  const onChangeGroupSel = (sc1, e) => {
    if (sc1) {
      setGroupSelIdByDatasetType((value) => {
        value = { ...(value ?? {}) };

        value[sc1] = e.target.value;

        return value;
      });
    }
  };

  const renderList = useMemo<React.ReactNode>(() => {
    let res = useCaseInfo?.list?.map((s1, s1ind) => {
      const uc1 = useCaseInfo[s1];
      const sc1 = uc1?.dataset_type?.toUpperCase();
      if (!Utils.isNullOrEmpty(sc1)) {
        let ff = featuresGroupsList
          ?.map((f1, f1ind) => {
            if (useCaseInfo != null) {
              if (sc1 === f1.datasetType?.toUpperCase()) {
                // @ts-ignore
                return (
                  <Radio
                    key={'fea' + f1ind + '_' + s1ind}
                    value={f1.tableName}
                    css={`
                      margin: 10px 0;
                      font-size: 16px;
                      display: block;
                    `}
                  >
                    <span className={sd.styleTextGreen}>{f1.tableName}</span>
                  </Radio>
                );
              }
            }
          })
          ?.filter((v1) => v1 != null);

        return (
          <div
            key={'aa' + s1ind}
            css={`
              margin-bottom: 14px;
            `}
          >
            <div
              css={`
                padding: 16px;
                border: 1px solid ${Utils.colorA(0.2)};
                border-radius: 6px;
              `}
            >
              <div
                className={sd.styleTextGreen}
                css={`
                  font-size: 16px;
                  line-height: 1;
                  border-bottom: 1px solid ${Utils.colorA(0.14)};
                `}
                style={{ paddingBottom: '14px', color: Utils.colorAall(1) }}
              >
                {uc1?.title}
                <span
                  css={`
                    margin-left: 5px;
                    opacity: 0.5;
                  `}
                >
                  {uc1?.is_required ?? uc1?.isRequired ? '(Required)' : '(Optional)'}
                </span>
              </div>

              <Radio.Group value={groupSelIdByDatasetType?.[sc1]} onChange={onChangeGroupSel.bind(null, sc1)}>
                {/*// @ts-ignore*/}
                <Radio
                  value={undefined}
                  css={`
                    margin: 10px 0;
                    font-size: 16px;
                    display: block;
                  `}
                >
                  <span
                    className={sd.styleTextBlue}
                    css={`
                      color: white;
                    `}
                  >
                    (None)
                  </span>
                </Radio>
                {ff}
              </Radio.Group>
            </div>
          </div>
        );
      } else {
        return null;
      }
    });

    return _.flatten(res?.filter((v1) => v1 != null) ?? []);
  }, [featuresGroupsList, useCaseInfo, groupSelIdByDatasetType]);

  const canTrain = useMemo(() => {
    let res = true;

    useCaseInfo?.list?.some((s1, s1ind) => {
      const uc1 = useCaseInfo[s1];
      const sc1 = uc1?.dataset_type?.toUpperCase();
      if (!Utils.isNullOrEmpty(sc1)) {
        let v1 = groupSelIdByDatasetType?.[sc1];
        if (v1 == null && uc1.is_required) {
          res = false;
          return true;
        }
      }
    });

    return res;
  }, [useCaseInfo, groupSelIdByDatasetType]);

  return (
    <div
      css={`
        margin: 20px;
        text-align: center;
      `}
    >
      <div
        css={`
          text-align: left;
          display: inline-block;
          width: 400px;
        `}
      >
        <div
          className={sd.titleTopHeaderAfter}
          css={`
            margin-bottom: 20px;
            text-align: center;
          `}
        >
          Train Model - Feature Groups
          <HelpIcon id={'ModelTrainFeatureGroup_title'} style={{ marginLeft: '4px' }} />
        </div>
        {/*// @ts-ignore*/}
        <div
          css={`
            margin-top: 20px;
          `}
        >
          {renderList}
          <div
            css={`
              margin-top: 20px;
              text-align: center;
            `}
          >
            <Button type={'primary'} disabled={canTrain}>
              Train Model
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ModelTrainFeatureGroup;
