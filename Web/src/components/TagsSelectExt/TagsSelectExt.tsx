import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./TagsSelectExt.module.css');
const sd = require('../antdUseDark.module.css');

interface ITagsSelectExtProps {
  options?: { label?; value?; isDisabled? }[];
  value?: string[];
  onChange?: (value) => void;
  itemIdForProjectId?: string;
  staticNames?: string[];
  addName?: string;
  hideDelete?: boolean;
  isCustom?: boolean;
  customTypeIsString?: boolean;
  customNumberDecimals?: number;
  customNumberMin?: number;
  customNumberMax?: number;
  disabled?: boolean;
}

const TagsSelectExt = React.memo((props: PropsWithChildren<ITagsSelectExtProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [value, setValue] = useState(props.value ?? []);
  const [firstFixedText, setFirstFixedText] = useState(props.staticNames);
  const [tagValueOne, setTagValueOne] = useState(null);

  useEffect(() => {
    const projectId = props.itemIdForProjectId;
    if (!Utils.isNullOrEmpty(projectId)) {
      REClient_.client_().listProjectDatasets(projectId, (errD, resD) => {
        if (errD || !resD?.success) {
          //
        } else {
          let datauseListPromise = [];
          resD?.result?.some((d1) => {
            const datasetId = d1?.dataset?.datasetId;
            if (!Utils.isNullOrEmpty(datasetId)) {
              datauseListPromise.push(
                new Promise((resolve, error) => {
                  REClient_.client_().get_project_dataset_data_use(projectId, datasetId, undefined, undefined, (err, res) => {
                    if (err || !res?.success || !res?.result) {
                      resolve(null);
                    } else {
                      resolve(res?.result);
                    }
                  });
                }),
              );
            }
          });

          Promise.all(datauseListPromise).then(
            (res) => {
              let isEnd = false;
              res?.some((r1) => {
                r1?.schema?.some((s1) => {
                  if (s1.featureMapping?.toUpperCase() === 'ITEM_ID') {
                    setFirstFixedText(s1.name ? [s1.name] : null);
                    isEnd = true;
                    return true;
                  }
                });
                if (isEnd) {
                  return true;
                }
              });
            },
            (err) => {
              //
            },
          );
        }
      });
    }
  }, [props.itemIdForProjectId]);

  useEffect(() => {
    if (!_.isEqual(props.value, value)) {
      setValue(props.value);
    }
  }, [props.value]);

  const onClickRemove = (value1, e) => {
    let vv = [...(value ?? [])];
    vv = vv.filter((v1) => v1 !== value1);
    setValue(vv);

    props.onChange?.(vv);
  };

  const onClickAdd = (value1, e) => {
    if (!props.isCustom) {
      value1 = value1?.value;
    }
    if (value && value.includes(value1)) {
      return;
    }

    let vv = [...(value ?? []), value1];
    if (props.isCustom) {
      vv = vv?.filter((v1) => !Utils.isNullOrEmpty(v1));
    }
    setValue(vv);

    setTagValueOne(null);

    props.onChange?.(vv);
  };

  const rects = useMemo(() => {
    let vv = [];
    let usingFirst = 0;
    if (firstFixedText != null && _.isArray(firstFixedText) && firstFixedText.length > 0) {
      firstFixedText.some((t1) => {
        usingFirst++;
        vv.push({
          label: '' + t1,
          value: 'firstFixedText',
          isFixed: true,
        });
      });
    }

    value?.some((v1) => {
      if (props.isCustom) {
        if (v1 != null) {
          vv.push({ label: '' + v1, value: v1 });
        }
      } else {
        let v2 = props.options?.find((o1) => o1.value === v1);
        if (v2) {
          vv.push(v2);
        }
      }
    });
    if (vv.length - usingFirst !== props.options?.length || vv.length === 0) {
      if (props.addName !== '') {
        vv.push({ label: props.addName || 'Add Dimension', value: '__internalAdd__', isAdd: true });
      }
    }

    return vv.map((s1) => {
      let dropdown1 = null;
      if (s1.isAdd) {
        if (props.isCustom) {
          let onClickCustom = (e) => {
            setTagValueOne((s1) => {
              onClickAdd(s1, e);
              return s1;
            });
          };
          const onKeyPressInput = (e) => {
            if (e.key?.toLowerCase() === 'enter') {
              e?.stopPropagation?.();
              e?.preventDefault?.();

              onClickCustom(e);
            }
          };
          if (props.customTypeIsString) {
            dropdown1 = (
              <div
                css={`
                  width: 160px;
                  display: inline-flex;
                  align-items: center;
                  & .ant-input {
                    width: 130px;
                  }
                `}
              >
                <Input
                  disabled={props.disabled}
                  onKeyPress={onKeyPressInput}
                  onChange={(e) => {
                    setTagValueOne(e.target.value);
                  }}
                  value={tagValueOne}
                />
                <Button
                  disabled={props.disabled}
                  onClick={onClickCustom}
                  css={`
                    margin-left: 5px;
                  `}
                  type={'primary'}
                  size={'small'}
                >
                  Add
                </Button>
              </div>
            );
          } else {
            dropdown1 = (
              <div
                css={`
                  width: 160px;
                  display: inline-flex;
                  align-items: center;
                  & .ant-input-number {
                    width: 130px;
                  }
                `}
              >
                <InputNumber
                  disabled={props.disabled}
                  onKeyPress={onKeyPressInput}
                  precision={props.customNumberDecimals}
                  min={props.customNumberMin}
                  max={props.customNumberMax}
                  onChange={(v1) => {
                    setTagValueOne(v1);
                  }}
                  value={tagValueOne}
                />
                <Button
                  disabled={props.disabled}
                  onClick={onClickCustom}
                  css={`
                    margin-left: 5px;
                  `}
                  type={'primary'}
                  size={'small'}
                >
                  Add
                </Button>
              </div>
            );
          }
        } else {
          let popupContainerForMenu = (node) => document.getElementById('body2');
          let optionsAdd = props.options
            ?.map((o1, o1ind) => {
              if (vv.find((v1) => v1.value === o1.value)) {
                return null;
              }

              return {
                label: o1.label,
                value: o1.value,
              };
            })
            ?.filter((v1) => v1 != null);

          const onChangeAddOption = (option1) => {};

          dropdown1 = (
            <div
              css={`
                width: 160px;
                display: inline-block;
              `}
            >
              <SelectExt isDisabled={props.disabled} allTransparent value={{ label: s1.label, value: null }} options={optionsAdd} onChange={onClickAdd} menuPortalTarget={popupContainerForMenu(null)} />
            </div>
          );
        }
      }

      let res = (
        <div key={'tag_' + s1.value} className={props.isCustom && s1.isAdd ? '' : s.rect + ' ' + (s1.isAdd ? s.rectAdd : '')}>
          {dropdown1}
          {!s1.isAdd && s1.label}
          {!s1.isAdd && !s1.isFixed && !props.hideDelete && (
            <span
              className={props.disabled ? sd.pointerEventsAll : ''}
              css={`
                color: rgba(255, 255, 255, 0.8);
                padding: 0 2px 0 7px;
                cursor: pointer;
                :hover {
                  color: white;
                }
              `}
              onClick={onClickRemove.bind(null, s1.value)}
            >
              X
            </span>
          )}
        </div>
      );

      return res;
    });
  }, [value, firstFixedText, tagValueOne, props.options, props.isCustom, props.customTypeIsString, props.customNumberMin, props.customNumberMax]);

  return <div className={s.root + ' clearfix'}>{rects}</div>;
});

export default TagsSelectExt;
