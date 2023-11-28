import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import REActions from '../../actions/REActions';
import { useFeatureGroupFromProject, useFeatureGroupUsage, useModel, useProject, useUseCaseFromProjectOne, useUseCaseTypesListFromUseCaseDirect } from '../../api/REUses';
import SelectExt from '../SelectExt/SelectExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./FeatureGroupsFormItemsTraining.module.css');
const sd = require('../antdUseDark.module.css');

export const formFgidPrefix = 'fgid_';

interface IFeatureGroupsFormItemsTrainingProps {
  projectId?: string;
  onUseCaseTypesList?: (list: { isRequired?; title?; type?; data? }[]) => void;
  onSetFieldsValuesFromFGs?: (values) => void;
  onChangeValuesFromFGs?: () => void;
  title?: string;
  defaultsFromModelId?: string;
}

const FeatureGroupsFormItemsTraining = React.memo((props: PropsWithChildren<IFeatureGroupsFormItemsTrainingProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [typeCounts, setTypeCounts] = useState(null);
  const [typeCountsRemoved, setTypeCountsRemoved] = useState(null);
  const [removedIndexTypeCounts, setRemovedIndexTypeCounts] = useState(null);

  const foundProject1 = useProject(props.projectId);
  const fgsForTypeList = useFeatureGroupUsage(props.projectId);

  const useCase1 = useUseCaseFromProjectOne(foundProject1, false);
  const useCaseTypesListOri = useUseCaseTypesListFromUseCaseDirect(useCase1);

  const useCaseTypesList = useMemo(() => {
    return useCaseTypesListOri?.filter((f1) => !f1.isCustom && f1.trainable !== false);
  }, [useCaseTypesListOri]);

  useEffect(() => {
    props.onUseCaseTypesList?.(useCaseTypesList);
  }, [useCaseTypesList]);

  const fgList = useFeatureGroupFromProject(props.projectId);
  const fgListOptions = useMemo(() => {
    let res = fgList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res.unshift({ label: '(None)', value: null });
    }
    return res;
  }, [fgList]);

  const modelOne = useModel(props.defaultsFromModelId);

  useEffect(() => {
    if (fgListOptions != null) {
      if (props.defaultsFromModelId == null) {
        if (fgsForTypeList == null) {
          return;
        }
      } else {
        if (modelOne == null) {
          return;
        }
      }

      //
      let values: any = {},
        alreadyCount: any = {};
      const countCalc = (type1) => {
        let c1 = alreadyCount[type1];
        if (c1 == null) {
          c1 = 1;
        } else {
          c1++;
        }
        alreadyCount[type1] = c1;
        return '___' + c1;
      };

      if (props.defaultsFromModelId == null) {
        fgsForTypeList?.some((f1) => {
          if (!f1.useForTraining) {
            return;
          }

          values[formFgidPrefix + f1.type + countCalc(f1.type)] = fgListOptions?.find((o1) => o1.value === f1.featureGroupId);
        });
      } else {
        let listUsedForTraining = modelOne?.get('trainingFeatureGroupIds') ?? [];

        fgsForTypeList?.some((f1) => {
          if (!listUsedForTraining?.includes(f1.featureGroupId)) {
            return;
          }

          values[formFgidPrefix + f1.type + countCalc(f1.type)] = fgListOptions?.find((o1) => o1.value === f1.featureGroupId);
        });
      }

      setTypeCounts(alreadyCount ?? {});
      setRemovedIndexTypeCounts({});
      setTypeCountsRemoved({});
      props.onSetFieldsValuesFromFGs?.(values);
    }
  }, [fgsForTypeList, fgListOptions, props.defaultsFromModelId, modelOne]);

  const onChangeValue = useCallback(() => {
    props.onChangeValuesFromFGs?.();
  }, [props.onChangeValuesFromFGs]);

  const getRuleCustom = (uc) => {
    let ruleCustom;
    if (uc?.isRequired === true) {
      ruleCustom = ({ getFieldValue }) => ({
        validator(rule, value) {
          if (!value || value?.value == null) {
            return Promise.reject('Required!');
          }
          return Promise.resolve();
        },
      });
    }
    return ruleCustom;
  };

  const getFormItems = () => {
    let formItemsRes = [];
    for (let uc1ind = 0; uc1ind < useCaseTypesList?.length; uc1ind++) {
      let uc1 = useCaseTypesList[uc1ind];
      const optionsList = fgListOptions?.filter((f1) => f1.value == null || f1.data?.featureGroupType?.toUpperCase() === uc1.type?.toUpperCase());

      let ruleCustom = getRuleCustom(uc1);
      let isMulti = uc1?.data?.multi === true;

      let count1 = typeCounts?.[uc1.type] ?? 1;
      if (count1 < 1) {
        count1 = 1;
      }

      const onRemoveFGMulti = (type1, isRequired, ind1, e) => {
        setTypeCounts((cc) => {
          let c1 = cc[type1];

          if (c1 != null) {
            setTypeCountsRemoved((ccr) => {
              ccr = { ...(ccr ?? {}) };

              if (c1 === (ccr?.[type1] ?? 0) + 1 && isRequired === true) {
                REActions.addNotificationError('Required type. At least one Feature Group needed');
              } else {
                ccr[type1] = (ccr[type1] ?? 0) + 1;

                setRemovedIndexTypeCounts((cc) => {
                  cc = { ...(cc ?? {}) };
                  cc['' + type1 + '___' + ind1] = true;

                  if (c1 === ccr?.[type1]) {
                    setTimeout(() => {
                      onClickAddType(type1, null);
                    }, 0);
                  }
                  return cc;
                });
              }

              return ccr;
            });
          }

          return cc;
        });
      };

      const onClickAddType = (type1, e) => {
        setTypeCounts((cc) => {
          cc = { ...(cc ?? {}) };
          cc[type1] = (cc[type1] ?? 1) + 1;
          return cc;
        });
      };

      let res = [];
      for (let i = 0; i < count1; i++) {
        let cs1 = '___' + (i + 1);

        if (removedIndexTypeCounts?.['' + uc1.type + cs1] === true) {
          if (i + 1 === count1) {
            let addElem = (
              <div
                css={`
                  text-align: center;
                  margin-top: 1px;
                  margin-bottom: 20px;
                `}
              >
                <Button
                  css={`
                    opacity: 0.7;
                    border-radius: 4px;
                  `}
                  onClick={onClickAddType.bind(null, uc1.type)}
                  type={'default'}
                  ghost
                  size={'small'}
                >
                  Add Feature Group - Type {uc1.title}
                </Button>
              </div>
            );
            let multiElem = (
              <div css={``} key={'ftl_multi_last' + uc1.type + cs1}>
                {addElem}
              </div>
            );
            res.push(multiElem);
          }

          continue;
        }

        let formElem;
        if (uc1.data?.two_columns && useCaseTypesList[uc1ind + 1] != null) {
          uc1ind++;
          let uc2 = useCaseTypesList[uc1ind];
          let ruleCustom2 = getRuleCustom(uc2);
          const optionsList2 = fgListOptions?.filter((f1) => f1.value == null || f1.data?.featureGroupType?.toUpperCase() === uc2.type?.toUpperCase());

          formElem = (
            <div
              key={'ftl' + uc1.type + cs1 + '_' + uc2.type}
              css={`
                display: flex;
                flex-wrap: nowrap;
              `}
            >
              <Form.Item
                css={`
                  flex: 1;
                  margin-right: 9px;
                `}
                key={'ftl' + uc1.type + cs1}
                name={formFgidPrefix + uc1.type + cs1}
                rules={ruleCustom == null ? undefined : [ruleCustom, { required: true, message: 'Required!' }]}
                label={
                  <span
                    css={`
                      color: white;
                    `}
                  >
                    {uc1.title}
                  </span>
                }
              >
                <SelectExt options={optionsList} onChange={onChangeValue} />
              </Form.Item>
              <Form.Item
                css={`
                  flex: 1;
                  margin-left: 9px;
                `}
                key={'ftl' + uc2.type + cs1}
                name={formFgidPrefix + uc2.type + cs1}
                rules={ruleCustom2 == null ? undefined : [ruleCustom2, { required: true, message: 'Required!' }]}
                label={
                  <span
                    css={`
                      color: white;
                    `}
                  >
                    {uc2.title}
                  </span>
                }
              >
                <SelectExt options={optionsList2} onChange={onChangeValue} />
              </Form.Item>
            </div>
          );
        } else {
          formElem = (
            <Form.Item
              css={`
                flex: 1;
                margin-right: 9px;
              `}
              key={'ftl' + uc1.type + cs1}
              name={formFgidPrefix + uc1.type + cs1}
              rules={ruleCustom == null ? undefined : [ruleCustom, { required: true, message: 'Required!' }]}
              label={
                <span
                  css={`
                    color: white;
                  `}
                >
                  {uc1.title}
                </span>
              }
            >
              <SelectExt options={optionsList} onChange={onChangeValue} />
            </Form.Item>
          );
        }

        if (isMulti) {
          let multiElem = (
            <div
              css={`
                display: flex;
                align-items: center;
              `}
              key={'ftl_multi' + uc1.type + cs1}
            >
              {formElem}
              <div
                css={`
                  margin-left: 10px;
                  padding-top: 7px;
                `}
              >
                <TooltipExt title={'Remove Feature Group'}>
                  <span onClick={onRemoveFGMulti.bind(null, uc1.type, uc1.isRequired, i + 1)}>
                    <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faTimesCircle').faTimesCircle} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'red', cursor: 'pointer' }} />
                  </span>
                </TooltipExt>
              </div>
            </div>
          );

          if (i + 1 === count1) {
            let addElem = (
              <div
                css={`
                  text-align: center;
                  margin-top: 1px;
                  margin-bottom: 20px;
                `}
              >
                <Button
                  css={`
                    opacity: 0.7;
                    border-radius: 4px;
                  `}
                  onClick={onClickAddType.bind(null, uc1.type)}
                  type={'default'}
                  ghost
                  size={'small'}
                >
                  Add Feature Group - Type {uc1.title}
                </Button>
              </div>
            );
            multiElem = (
              <div css={``} key={'ftl_multi_last' + uc1.type + cs1}>
                {multiElem}
                {addElem}
              </div>
            );
          }

          res.push(multiElem);
        } else {
          res.push(formElem);
        }
      }
      formItemsRes.push(res);
    }

    return formItemsRes == null ? formItemsRes : _.flatten(formItemsRes);
  };

  const formItems = useMemo(() => getFormItems(), [useCaseTypesList, onChangeValue, typeCounts, removedIndexTypeCounts]);

  return (
    <>
      {props.title != null && (
        <div
          css={`
            margin-bottom: 10px;
            font-size: 12px;
            color: white;
            font-weight: bold;
            letter-spacing: 1.12px;
            text-transform: uppercase;
            font-family: Roboto;
          `}
        >
          {props.title}
        </div>
      )}
      {formItems}
    </>
  );
});

export default FeatureGroupsFormItemsTraining;
