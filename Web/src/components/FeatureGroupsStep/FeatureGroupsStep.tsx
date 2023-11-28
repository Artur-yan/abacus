import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
import defDatasets from '../../stores/reducers/defDatasets';
import featureGroups, { FeatureGroupLifecycle } from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./FeatureGroupsStep.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupsStepProps {
  showErrors?: boolean;
}

const FeatureGroupsStep = React.memo((props: PropsWithChildren<IFeatureGroupsStepProps>) => {
  const { paramsProp, authUser, useCasesParam, projectsParam, defDatasetsParam, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
    useCasesParam: state.useCases,
    defDatasetsParam: state.defDatasets,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isExpanded, setIsExpanded] = React.useState({});
  const projectId = paramsProp?.get('projectId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const useCase1 = foundProject1?.useCase;
  useEffect(() => {
    memUseCasesSchemasInfo(true, useCase1);
  }, [useCasesParam, useCase1]);
  const useCaseInfo = useMemo(() => {
    return memUseCasesSchemasInfo(false, useCase1);
  }, [useCasesParam, useCase1]);

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  useEffect(() => {
    defDatasets.memValidationForProjectId(true, projectId);
  }, [defDatasetsParam, projectId]);
  const validateData = useMemo(() => {
    return defDatasets.memValidationForProjectId(false, projectId);
  }, [defDatasetsParam, projectId]);

  const validateDataRes = useMemo(() => {
    let validationData = validateData;
    if (validationData && featuresGroupsList) {
      let res = null,
        resFirst = null,
        anyNotConfirmed = null,
        anyProcessing = null,
        anyNeedFix = null,
        anyUploaded = null,
        anyError = null,
        anyDataError = null;
      let allDatasets = (validationData?.requiredDatasets || []).concat(validationData?.optionalDatasets || []);
      if (allDatasets) {
        if (allDatasets.length === 0) {
          anyNeedFix = false;
          anyError = false;
          anyNotConfirmed = false;
          anyUploaded = false;
          anyDataError = false;
          anyProcessing = false;
        } else {
          let doAny = false;
          anyNotConfirmed = false;
          anyNeedFix = false;
          anyError = false;
          anyDataError = false;
          anyProcessing = false;

          allDatasets.some((d1) => {
            let fgFound1 = featuresGroupsList?.find((o1) => o1.featureGroupId === d1.featureGroupId);
            let isProcessing = [FeatureGroupLifecycle.PENDING, FeatureGroupLifecycle.GENERATING].includes(fgFound1?.status ?? '-');

            if (fgFound1 != null) {
              if (isProcessing) {
                anyProcessing = true;
              }
            }

            if (!d1.uploaded) {
              return false;
            }

            if (res == null && !resFirst) {
              if (fgFound1) {
                resFirst = fgFound1.featureGroupId;
              }
            }

            let needFix = false;
            if (d1.requiredColumns) {
              let kk = Object.keys(d1.requiredColumns);
              kk.some((k1) => {
                if (d1.requiredColumns[k1?.toUpperCase()] === false) {
                  needFix = true;
                  return true;
                }
              });
            }
            if (d1.uploaded) {
              anyUploaded = true;
            }
            if (needFix) {
              anyNeedFix = true;
              anyError = true;
            }
            if (d1.confirmed === false) {
              anyNotConfirmed = true;
            }

            if (res == null) {
              if (needFix || d1.confirmed === false) {
                doAny = true;
                if (fgFound1) {
                  res = fgFound1.featureGroupId;
                  // return true;
                }
              }
            }
          });
        }
      }

      if (validationData?.datasetErrors?.length > 0) {
        anyError = true;
        anyDataError = validationData?.datasetErrors.some((x) => x.type == 'DATA');
      }

      return { anyProcessing, res, resFirst, anyNotConfirmed, anyNeedFix, anyUploaded, anyError, anyDataError };
    }
  }, [validateData, featuresGroupsList]);

  const renderList = useMemo(() => {
    let res = featuresGroupsList?.map((f1, f1ind) => {
      let dsTypeName = null;
      if (useCaseInfo != null) {
        useCaseInfo.list?.some((s1) => {
          const uc1 = useCaseInfo[s1];
          if (uc1?.dataset_type?.toUpperCase() === f1.datasetType?.toUpperCase()) {
            dsTypeName = uc1?.title;
          } else if (f1.datasetType?.toUpperCase() === Constants.custom_table) {
            dsTypeName = Constants.custom_table_desc;
          }
        });
      }

      let useForTraining = f1?.useForTraining === true;
      if (f1?.shouldEnableUseForTraining === false) {
        useForTraining = false;
      }
      if (foundProject1?.isFeatureStore === true) {
        useForTraining = false;
      }

      let errMsgObj = null,
        useShowWizard;
      if (validateData && useForTraining && dsTypeName != null && props.showErrors) {
        validateData?.datasetErrors?.some((e1, e1ind) => {
          if (e1?.dataset?.toUpperCase() === f1.datasetType?.toUpperCase()) {
            if (errMsgObj == null) {
              errMsgObj = e1;
            }
            if (e1?.type?.toUpperCase() === 'SCHEMA') {
              useShowWizard = 'showWizard=true';
            }
          }
        });
        if (errMsgObj == null && f1.featureGroupId != null) {
          validateData?.requiredDatasets?.concat(validateData?.optionalDatasets ?? [])?.some((d1) => {
            if (d1?.featureGroupId === f1.featureGroupId) {
              d1?.invalidColumns?.some((ic1) => {
                if (ic1 != null) {
                  let k1 = Object.keys(ic1)?.[0];
                  if (!Utils.isNullOrEmpty(k1)) {
                    let errM1 = ic1[k1];
                    if (!Utils.isNullOrEmpty(errM1)) {
                      errMsgObj = { message: `${errM1} on field "${k1}"` };
                      useShowWizard = null;
                      return true;
                    }
                  }
                }
              });
            }
          });
        }
      }

      let res = (showTitle: boolean) => (
        <div
          key={'fea' + f1ind}
          css={`
            margin-bottom: 10px;
          `}
        >
          {showTitle && (
            <div className={sd.styleTextGreen} style={{ marginBottom: '3px', color: Utils.colorAall(1) }}>
              {dsTypeName}
            </div>
          )}
          <div className={sd.styleTextBlue}>
            <Link to={'/' + PartsLink.feature_group_detail + '/' + projectId + '/' + f1.featureGroupId}>{f1.tableName}</Link>
          </div>
          {errMsgObj != null && (
            <Link to={['/' + PartsLink.features_list + '/' + projectId + '/' + f1.featureGroupId, useShowWizard]}>
              <div>
                <Button
                  size={'small'}
                  danger
                  css={`
                    margin: 8px 0 7px 0;
                    display: inline-block;
                    background: #ce3536;
                    color: white;
                  `}
                >
                  Fix errors
                </Button>
                {!Utils.isNullOrEmpty(errMsgObj?.message) && (
                  <span
                    css={`
                      margin-left: 8px;
                    `}
                  >
                    <TooltipExt title={errMsgObj?.message}>
                      <FontAwesomeIcon className={sd.styleTextRedColor} icon={['far', 'exclamation-circle']} transform={{ size: 19, x: 0, y: 0 }} style={{ opacity: 1 }} />
                    </TooltipExt>
                  </span>
                )}
              </div>
            </Link>
          )}
        </div>
      );

      return {
        f1,
        useForTraining,
        name: f1.tableName,
        res,
        dsTypeName: f1.datasetType?.toUpperCase(),
      };
    });

    const filterAndPrepareSublist = (list, f1ind) => {
      if (!list) {
        return list;
      }

      list = [...list];

      let useTrain1 = list.find((v1) => v1.useForTraining);
      if (useTrain1 != null) {
        list.splice(list.indexOf(useTrain1), 1);
        list.unshift(useTrain1);
      }

      const max = 2;
      if (list.length > max && !isExpanded[f1ind]) {
        const len = list.length;
        list = list.slice(0, max);

        let res = () => (
          <div
            key={'fea_more' + f1ind}
            css={`
              margin-bottom: 10px;
            `}
          >
            {
              <div
                onClick={() => setIsExpanded({ ...isExpanded, [f1ind]: true })}
                css={`
                  font-size: 13px;
                  cursor: pointer;
                  color: #1890ff;
                `}
              >
                (And {len - max} more...)
              </div>
            }
          </div>
        );

        list.push({
          isMore: true,
          count: len - max,
          res,
        });
      }

      return list;
    };

    let list = [];
    useCaseInfo?.list?.some((s1, s1ind) => {
      const uc1 = useCaseInfo[s1];
      const sc1 = uc1?.dataset_type?.toUpperCase();
      list = list.concat(
        filterAndPrepareSublist(
          res?.filter((v1) => v1.dsTypeName === sc1),
          s1ind,
        ) ?? [],
      );
    });
    list = list.concat(
      filterAndPrepareSublist(
        res?.filter((v1) => v1.dsTypeName == null),
        999999,
      ) ?? [],
    );

    return list.map((v1, v1ind) => {
      let v1Last = list[v1ind - 1];
      const showTitle = v1Last == null || v1.dsTypeName !== v1Last.dsTypeName;
      return v1.res(showTitle);
    });
  }, [featuresGroupsList, useCaseInfo, validateData, props.showErrors, foundProject1, isExpanded]);

  const needConfirmButton = useMemo(() => {
    if (Utils.isNullOrEmpty(validateDataRes?.res)) {
      return null;
    }

    let buttonName = null,
      link1 = null;
    if (validateDataRes?.anyNeedFix === true) {
      buttonName = 'Fix Mapping Errors';
      link1 = '/' + PartsLink.features_list + '/' + projectId + '/' + validateDataRes?.res;
    } else if (validateDataRes?.anyNotConfirmed === true) {
      buttonName = 'Confirm Schema Mapping';
      link1 = '/' + PartsLink.features_list + '/' + projectId + '/' + validateDataRes?.res;
    } else if (validateDataRes?.anyDataError === true) {
      buttonName = 'Update Feature Group';
      link1 = '/' + PartsLink.features_list + '/' + projectId + '/' + validateDataRes?.res;
    } else if (validateDataRes?.anyError === true) {
      buttonName = 'Fix Schema Errors';
      link1 = '/' + PartsLink.features_list + '/' + projectId + '/' + validateDataRes?.res;
    }
    if (buttonName == null) {
      return null;
    }

    let res = (
      <Button className={sd.styleTextRedColorBack} type={'primary'} style={{ marginTop: '10px', width: '100%' }}>
        {buttonName}
      </Button>
    );
    if (link1 != null) {
      res = <Link to={[link1, 'showWizard=true']}>{res}</Link>;
    }
    return res;
  }, [validateDataRes, projectId]);

  return (
    <div
      css={`
        margin-top: 20px;
      `}
    >
      {renderList}
      <div style={{ marginTop: '18px', marginBottom: '7px', textAlign: 'center' }}>
        <Link to={['/' + PartsLink.feature_group_attach + '/' + projectId, 'useCase=' + encodeURIComponent(useCase1)]}>
          <span className={sd.styleTextBlueBright} style={{ cursor: 'pointer' }}>
            Attach Existing Feature Group
          </span>
        </Link>
      </div>
      {needConfirmButton}
    </div>
  );
});

export default FeatureGroupsStep;
