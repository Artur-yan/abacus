import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import defDatasets, { calcReqFeaturesByUseCase, calcReqFeaturesByUseCaseError, calcReqFeaturesByUseCaseFindDatasetType } from '../../stores/reducers/defDatasets';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./FeaturesOneWizard.module.css');
const sd = require('../antdUseDark.module.css');
const { confirm } = Modal;

interface IFeaturesOneWizardProps {}

const FeaturesOneWizard = React.memo((props: PropsWithChildren<IFeaturesOneWizardProps>) => {
  const { paramsProp, featureGroupsParam, useCasesParam, datasetsParam, defDatasetsParam, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
    defDatasetsParam: state.defDatasets,
    datasetsParam: state.datasets,
    useCasesParam: state.useCases,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredRefreshAll, forceUpdateRefreshAll] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataList, setDataList] = useState([] as { open?; featureType?; isNested?; columns?; featureMapping?; name?; sql?; isColumn?; dataType?; sourceDatasets? }[]);

  const [wizardSelectedOption, setWizardSelectedOption] = useState(null);
  const [wizardSelectedOptionColFound, setWizardSelectedOptionColFound] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  const featureGroupId = paramsProp?.get('featureGroupId');

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

  const FeaturesOneWizard = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);

  const validation = useMemo(() => {
    return defDatasets.memValidationForProjectId(false, projectId);
  }, [defDatasetsParam, projectId]);
  useEffect(() => {
    defDatasets.memValidationForProjectId(true, projectId);
  }, [defDatasetsParam, projectId]);

  const featureGroupForDatasetOne = useMemo(() => {
    let res = null;
    if (featureGroupId) {
      res = featuresGroupsList?.find((v1) => v1.featureGroupId === featureGroupId);
    }
    return res;
  }, [featuresGroupsList, featureGroupId]);

  const memRequFeatures = (doCall, defDatasets, projects, projectId, projectFound1, datasetType) => {
    if (projects && projectId && defDatasets) {
      if (projectFound1) {
        let useCase = projectFound1.useCase;
        if (!Utils.isNullOrEmpty(useCase)) {
          let reqFields = calcReqFeaturesByUseCase(undefined, useCase);
          let reqError = calcReqFeaturesByUseCaseError(undefined, useCase);
          if (reqFields) {
            const reqFieldsAll = reqFields?.toJS();
            if (datasetType && reqFields) {
              let rr = calcReqFeaturesByUseCaseFindDatasetType(reqFields, datasetType);
              if (rr) {
                rr = rr.toJS();
              }
              reqFields = rr || [];
            } else {
              reqFields = [];
            }

            return { reqFields, reqError, reqFieldsAll };
          } else {
            if (defDatasets.get('isRefreshing') === 0) {
              if (doCall) {
                StoreActions.featuresByUseCase_(useCase);
              }
            }
          }
        }
      }
    }
  };
  useEffect(() => {
    memRequFeatures(true, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne?.datasetType);
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne]);
  const { reqFields, reqError, reqFieldsAll } = useMemo(() => {
    return memRequFeatures(false, defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne?.datasetType) ?? { reqFields: null, reqError: null, reqFieldsAll: null };
  }, [defDatasetsParam, projectsParam, projectId, foundProject1, featureGroupForDatasetOne]);

  useEffect(() => {
    let res = [];

    const calcObj = (c1) => {
      return {
        featureGroupIdOri: c1.featureGroupId,
        isNested: c1.columns != null,
        isColumn: c1.selectClause == null && c1.columns == null,
        name: c1.name,
        featureType: c1.featureType,
        featureMapping: c1.featureMapping,
        sourceDatasets: c1.sourceDatasets,
        sourceTable: c1.sourceTable,
        sql: c1.selectClause,

        columns: c1.columns,
        usingClause: c1.usingClause,
        whereClause: c1.whereClause,
        orderClause: c1.orderClause,
      };
    };

    calcSchemaForFeature(FeaturesOneWizard)?.some((c1) => {
      res.push(calcObj(c1));
    });

    FeaturesOneWizard?.features?.some((f1, f1ind) => {
      res.push({
        isColumn: false,
        name: f1.name,
        sql: f1.sql,
        featureType: f1.featureType,
      });
    });

    setDataList(res);
  }, [projectId, FeaturesOneWizard]);

  useEffect(() => {
    defDatasets.memSchemaForFeatureGrouptId(true, projectId, featureGroupId);
  }, [defDatasetsParam, projectId, featureGroupId]);
  const schemaFeatureGroupModel = useMemo(() => {
    return defDatasets.memSchemaForFeatureGrouptId(false, projectId, featureGroupId);
  }, [defDatasetsParam, projectId, featureGroupId]);
  useEffect(() => {
    if (schemaFeatureGroupModel?.toJS()) {
      let res = [];

      let list = schemaFeatureGroupModel?.toJS()?.schema;
      list?.some((c1) => {
        res.push({
          isColumn: c1.selectClause == null,
          name: c1.name,
          featureType: c1.featureType,
          featureMapping: c1.featureMapping,
          sourceDatasets: c1.sourceDatasets,
          sourceTable: c1.sourceTable,
          sql: c1.selectClause,
        });
      });

      setDataList(res);
    }
  }, [schemaFeatureGroupModel]);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const { optionsColumnNames, optionsColumnNamesTimestamps } = useMemo(() => {
    let optionsColumnNamesTimestamps = [];

    let optionsColumnNames = dataList?.map((c1) => {
      if (c1.featureType?.toLowerCase() === 'timestamp') {
        optionsColumnNamesTimestamps.push({
          label: c1.name,
          value: c1.name,
        });
      }

      return {
        label: c1.name,
        value: c1.name,
      };
    });

    optionsColumnNames?.unshift({ label: '(None)', value: null });
    optionsColumnNamesTimestamps?.unshift({ label: '(None)', value: null });

    return { optionsColumnNames, optionsColumnNamesTimestamps };
  }, [dataList]);

  //
  const { optionsFields, colFound1, isConfirm, columnsToAsk, indThisAsk, descKey } = useMemo(() => {
    if (!reqFields || !optionsColumnNames || !validation) {
      return {};
    }

    let validationData = validation;
    let allowedFeatureMappings = reqFields?.allowedFeatureMappings;

    let optionsFields = [...(optionsColumnNames ?? [])];
    optionsFields = optionsFields.filter((o1) => o1.value != null);

    let kk = Object.keys(allowedFeatureMappings ?? {});
    let columns = [];
    kk.some((k1) => {
      let obj1 = _.assign({}, allowedFeatureMappings[k1], {
        featureMapping: k1,
      });

      if (obj1.required && !obj1.multiple && obj1.featureMapping) {
        columns.push(obj1);
      }
    });
    let columnsAll = [...columns];

    let columnsToAsk = [];
    let columnsToAskErrors = [...columnsToAsk];

    let needConfirm = false;
    if (validationData) {
      let valAll = (validationData?.requiredDatasets || []).concat(validationData?.optionalDatasets || []);
      let valFound1 = valAll.find((d1) => d1.datasetType?.toLowerCase() === reqFields.datasetType?.toLowerCase());
      if (valFound1 && valFound1.confirmed === false) {
        needConfirm = true;
      }
      if (valFound1) {
        let kk2 = Object.keys(valFound1?.requiredColumns ?? {});
        let kk = [];
        kk2.some((k2) => {
          if (valFound1?.requiredColumns?.[k2] === false) {
            kk.push(k2);
          }
        });
        columnsAll.some((c1) => {
          if (kk.includes(c1.featureMapping)) {
            columnsToAsk.push(c1);
          }
        });
      }
    }
    if (!needConfirm) {
      // columnsToAsk = [];
    }

    let usedSchema = schemaFeatureGroupModel;
    if (needConfirm) {
      if (usedSchema) {
        let typesNeeded = usedSchema
          .toJS()
          .schema?.map((s1) => s1.featureMapping)
          ?.filter((d1) => d1 != null);
        if (typesNeeded && typesNeeded.length > 0) {
          let columnsToAsk2 = [];
          typesNeeded.some((t1) => {
            if (columnsToAsk.find((c1) => c1?.featureMapping?.toLowerCase() === t1?.toLowerCase()) == null) {
              let c1 = columnsAll.find((c1) => c1?.featureMapping?.toLowerCase() === t1?.toLowerCase());
              if (c1) {
                columnsToAsk2.push(c1);
              }
            }
          });

          if (columnsToAsk?.length === 0 || columnsToAsk == null) {
            columnsToAsk = columnsToAsk2;
          }
        }
      }
    }

    let indThisAsk = 1;

    let isConfirm = false;
    let colFound1 = columnsToAsk ? columnsToAsk[0] : null;

    let schemaFound1 = null;
    if (usedSchema) {
      schemaFound1 = usedSchema?.toJS()?.schema?.find((s1) => s1.featureMapping === colFound1?.featureMapping);
      if (schemaFound1) {
        if (columnsToAskErrors.find((c1) => c1 === colFound1.featureMapping) == null) {
          isConfirm = true;
        }
      }
    }

    if (!_.isEqual(wizardSelectedOptionColFound, colFound1)) {
      let newState1: any = null;
      if (wizardSelectedOption) {
        newState1 = {
          wizardSelectedOption: null,
          wizardSelectedOptionColFound: null,
        };
      }

      if (usedSchema) {
        if (schemaFound1) {
          let f1 = optionsFields.find((o1) => o1.value?.toLowerCase() === schemaFound1.name?.toLowerCase());
          if (f1) {
            newState1 = {
              wizardSelectedOption: f1,
              wizardSelectedOptionColFound: colFound1,
            };
          }
        }
      }

      if (newState1 != null) {
        let setDo = [];
        if (!_.isEqual(newState1.wizardSelectedOption, wizardSelectedOption)) {
          setDo.push(() => {
            setWizardSelectedOption(newState1.wizardSelectedOption);
          });
        }
        if (!_.isEqual(newState1.wizardSelectedOptionColFound, wizardSelectedOptionColFound)) {
          setDo.push(() => {
            setWizardSelectedOptionColFound(newState1.wizardSelectedOptionColFound);
          });
        }

        if (setDo.length > 0) {
          setTimeout(() => {
            setDo.some((d1) => {
              d1();
            });
          }, 0);
        }
      }
    }

    let descKey = colFound1?.description;

    return { optionsFields, colFound1, isConfirm, columnsToAsk, indThisAsk, descKey };
  }, [reqFields, validation, wizardSelectedOption, wizardSelectedOptionColFound, schemaFeatureGroupModel, optionsColumnNames]);

  const saveIsDisabled = false;
  let menuPortalTarget = popupContainerForMenu(null);

  const onChangeOptionWizard = (colFound1, option) => {
    setWizardSelectedOptionColFound(colFound1);
    setWizardSelectedOption(option);
  };

  const onClickNextWizard = (saveIsDisabled, isConfirm, isLast, reqFields, e) => {
    let wizOption = wizardSelectedOption?.value;
    let wizOptionColFound = wizardSelectedOptionColFound;

    if (!wizOption || !wizOptionColFound) {
      REActions.addNotificationError(Constants.errorDefault);
      return;
    }

    REClient_.client_().setFeatureMapping(projectId, featureGroupId, wizOption, wizOptionColFound?.featureMapping, undefined, (err, res, isLast) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.resetSchemaChanged_();
        StoreActions.featureGroupsGetByProject_(projectId, (list) => {
          list?.some((f1) => {
            StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
          });
        });
        StoreActions.validateProjectDatasets_(projectId);
        StoreActions.schemaGetFileFeatureGroup_(projectId, featureGroupId);
      }
    });
  };

  useEffect(() => {
    if (validation?.confirmed === true && validation?.valid === true) {
      Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/' + featureGroupId);
    } else {
      let alreadyPush = false;
      let valAll = (validation?.requiredDatasets || []).concat(validation?.optionalDatasets || []);

      if (!alreadyPush) {
        valAll?.some((v1) => {
          if (Object.values(v1?.requiredColumns ?? {}).some((v1) => v1 === false)) {
            if (paramsProp?.get('featureGroupId') !== v1?.featureGroupId) {
              alreadyPush = true;
              Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/' + v1?.featureGroupId, undefined, 'showWizard=true');
            }
            return true;
          }
        });
      }
      if (!alreadyPush) {
        valAll?.some((v1) => {
          if (v1?.confirmed === false) {
            if (paramsProp?.get('featureGroupId') !== v1?.featureGroupId) {
              alreadyPush = true;
              Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/' + v1?.featureGroupId, undefined, 'showWizard=true');
            }
            return true;
          }
        });
      }
    }
  }, [validation]);

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 10px 30px;
      `}
    >
      <RefreshAndProgress isRefreshing={isRefreshing}>
        <div style={{ display: 'block', marginTop: '20px' }}>
          <div style={{ maxWidth: '70%', minWidth: '480px', margin: '0 auto' }}>
            <div style={{ fontFamily: 'Matter', fontSize: '24px', lineHeight: 1.33, textAlign: 'center', color: '#ffffff', margin: '0 auto 20px auto' }}>Tell us which of your columns map to our column types</div>
            <div style={{ margin: '18px auto 0 auto', fontSize: '15px', backgroundColor: '#0c121b', borderRadius: '1px', padding: '20px 20px' }}>
              <div style={{ margin: '8px 0', fontFamily: 'Matter', fontSize: '16px', fontWeight: 800, lineHeight: 1.38, letterSpacing: 'normal', textAlign: 'center', color: '#ffffff' }}>
                <span className={sd.styleTextGreen} style={{ fontSize: '16px', fontFamily: 'Matter' }}>
                  {Utils.upperFirst(colFound1?.featureMapping ?? '', true)}
                </span>
                :&nbsp;{descKey}
              </div>
              <div style={{ margin: '14px 0 20px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <span>
                    <div style={{ marginBottom: '5px', fontFamily: 'Roboto', fontSize: '12px', letterSpacing: '1.12px', color: '#ffffff', textTransform: 'uppercase' }}>
                      {Utils.upperFirst(colFound1?.featureMapping ?? '', true)} is equivalent to
                    </div>
                    <div>
                      <div style={{ width: '347px', marginRight: '10px', display: 'inline-block' }}>
                        <SelectExt value={wizardSelectedOption} style={{ width: '100%' }} options={optionsFields} onChange={onChangeOptionWizard.bind(null, colFound1)} menuPortalTarget={menuPortalTarget} />
                      </div>
                      {isConfirm === true && <span style={{ fontFamily: 'Matter', fontSize: '12px', fontWeight: 600, color: '#f1f1f1' }}>(Confirm)</span>}
                    </div>
                  </span>
                </div>
              </div>
              <div style={{ margin: '8px 0', textAlign: 'center' }}>
                {columnsToAsk != null && (
                  <Button
                    style={{ maxWidth: '70%', minWidth: '480px' }}
                    disabled={wizardSelectedOption == null || wizardSelectedOptionColFound == null}
                    type={'primary'}
                    onClick={onClickNextWizard.bind(null, saveIsDisabled, isConfirm, columnsToAsk?.length === 1, reqFields)}
                  >
                    {columnsToAsk?.length === 1 ? (saveIsDisabled ? (isConfirm ? 'Confirm and continue' : 'Continue') : 'Set and save schema') : (isConfirm ? 'Confirm' : 'Next') + ' (' + indThisAsk + '/' + (columnsToAsk?.length ?? 0) + ')'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </RefreshAndProgress>
    </div>
  );
});

export default FeaturesOneWizard;
