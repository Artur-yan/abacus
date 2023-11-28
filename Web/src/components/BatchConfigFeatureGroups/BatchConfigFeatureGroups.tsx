import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Utils from '../../../core/Utils';
import { useBatchPred, useDeploymentBatchPredictionInfo, useFeatureGroupFromProject, useProject, useUseCaseFromProjectOne } from '../../api/REUses';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./BatchConfigFeatureGroups.module.css');
const sd = require('../antdUseDark.module.css');

interface IBatchConfigFeatureGroupsProps {
  onChange?: (newValue?: any) => void;
  value?: string[];

  readonly?: boolean;

  deploymentId?: string;
  projectId?: string;
  batchPredId?: string;
}

const BatchConfigFeatureGroups = React.memo((props: PropsWithChildren<IBatchConfigFeatureGroupsProps>) => {
  // const { paramsProp, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  // }));

  const foundProject1 = useProject(props.projectId);
  const batchPredOne = useBatchPred(props.batchPredId);

  const isEdit = !Utils.isNullOrEmpty(props.batchPredId);

  const [values, setValues] = useState(null as any);

  const fgList = useFeatureGroupFromProject(props.projectId);

  const deployInfo = useDeploymentBatchPredictionInfo(props.deploymentId);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const lastValueInit = useRef(null);
  useEffect(() => {
    if (lastValueInit.current != null && _.isEqual(lastValueInit.current, props.value)) {
      return;
    }

    lastValueInit.current = props.value;
    setValues(props.value ?? null);
  }, [props.value]);

  const fgIds = useMemo(() => {
    return batchPredOne?.batchInputs?.featureGroups?.map((v1) => v1.featureGroupId);
  }, [batchPredOne]);

  const useCaseInfo = useUseCaseFromProjectOne(foundProject1);

  const listTypes: { featureGroupId?; isDefault?; name?; required?; type? }[] = useMemo(() => {
    if (deployInfo == null || useCaseInfo == null) {
      return;
    }

    //
    let res = deployInfo?.batchInputs?.featureGroups
      ?.map((fg1) => {
        let listUsed1 = useCaseInfo?.list?.find((l1) => useCaseInfo?.[l1]?.dataset_type?.toUpperCase() === fg1?.datasetType?.toUpperCase());
        if (listUsed1 != null) {
          let u1 = useCaseInfo?.[listUsed1];
          return {
            name: u1.title,
            required: fg1?.required === true,
            type: u1.dataset_type,
            isDefault: fg1?.default === true,
            featureGroupId: fg1?.featureGroupId,
          };
        }
      })
      ?.filter((v1) => v1 != null);

    if (res != null) {
      res = _.orderBy(res, ['required', 'name'], ['desc', 'asc']);
    }
    return res;
  }, [useCaseInfo, deployInfo]);

  const optionsFgList = useMemo(() => {
    let res = fgList;
    const isPretrained = foundProject1?.isPretrained ?? false;
    res = fgList?.filter((fg) => listTypes?.some((type) => type.featureGroupId !== fg.featureGroupId || isPretrained)).map((f1) => ({ label: f1.tableName + ' - ' + f1.featureGroupId, value: f1.featureGroupId }));
    if (res != null) {
      res = _.sortBy(res, (o1) => o1.label);
    }

    res ??= [];
    if (!isPretrained) {
      res.unshift({ label: '(Used For Training)', value: null });
    }

    return res;
  }, [fgList, listTypes]);

  const onChangeValues = (type1, option1) => {
    setValues((vv) => {
      vv = { ...(vv ?? {}) };
      vv[type1] = option1?.value ?? null;

      props.onChange?.(vv);

      return vv;
    });
  };

  return (
    <div
      css={`
        margin-left: 22px;
        color: white;
      `}
    >
      {listTypes?.map((t1, t1ind) => {
        if (t1 == null) {
          return null;
        }

        let linkToFG = null;
        if (props.readonly && t1?.featureGroupId) {
          let isTraining = values?.[t1?.type] == null;

          let fgId1 = values?.[t1?.type] || t1?.featureGroupId;
          let p1 = props.projectId == null || fgId1 == null || fgList?.find((f1) => f1?.featureGroupId === fgId1) == null ? '-' : '' + props.projectId;
          let prefix = isTraining ? '' : 'Overridden - ';
          let label = optionsFgList?.find((o1) => o1.value === fgId1)?.label;
          if (!label) {
            prefix = '';
            label = fgId1;
          }
          linkToFG = (
            <span
              css={`
                margin-left: 10px;
                font-size: 16px;
              `}
            >
              {prefix}
              <Link to={`/${PartsLink.feature_group_detail}/${p1}/${fgId1}`} usePointer className={sd.styleTextBlueBright}>
                <span
                  css={`
                    font-size: 18px;
                  `}
                >
                  {label}
                </span>
              </Link>
            </span>
          );
        }
        return (
          <div
            css={`
              margin: 8px 0;
            `}
            key={'t' + t1.type}
          >
            {linkToFG == null && (
              <div>
                {t1.name}
                {t1.required ? (
                  <span
                    css={`
                      margin-left: 5px;
                      opacity: 0.7;
                    `}
                  >
                    (Required)
                  </span>
                ) : null}
              </div>
            )}
            {linkToFG == null && (
              <div
                css={`
                  margin-top: 5px;
                `}
              >
                <SelectExt isDisabled={props.readonly} options={optionsFgList} value={optionsFgList?.find((o1) => o1.value == values?.[t1.type])} onChange={onChangeValues.bind(null, t1.type)} />
              </div>
            )}
            {linkToFG != null && (
              <span>
                {t1.name}
                {t1.required ? (
                  <span
                    css={`
                      margin-left: 5px;
                      opacity: 0.7;
                    `}
                  >
                    (Required)
                  </span>
                ) : null}
                :
                <span
                  css={`
                    margin-left: 10px;
                  `}
                ></span>
                {linkToFG}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default BatchConfigFeatureGroups;
