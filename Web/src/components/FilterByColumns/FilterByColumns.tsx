import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useRef, useState } from 'react';
import Utils from '../../../core/Utils';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
const s = require('./FilterByColumns.module.css');
const sd = require('../antdUseDark.module.css');

interface IFilterByColumnsProps {
  onChange?: (columnsList: string[], isIgnoreNonColumns: boolean, findText?: string, prioritizeFeatureMappedColumns?: boolean) => void;
  columnsList?: string[];
  hideNonIgnoredColumns?: boolean;
  hideCount?: boolean;
  includeAll?: boolean;
  countIncludeAll?: boolean;
  showPrioritizeFeatureMappedColumns?: boolean;
}

const FilterByColumns = React.memo((props: PropsWithChildren<IFilterByColumnsProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [columnFilterText, setColumnFilterText] = useState('');
  const [isIgnoreNonColumns, setIsIgnoreNonColumns] = useState(false);
  const [prioritizeFeatureMappedColumns, setPrioritizeFeatureMappedColumns] = useState(false);
  const [nonIgnoredColumnsCount, setNonIgnoredColumnsCount] = useState(0);
  const [isSmallWindow, setIsSmallWindow] = useState(false);

  const lastSentRef = useRef({ res: null, isIgnoreNonColumns: false, text: '' } as any);

  const onChangeWinSize = (isMedium: boolean, isSmall: boolean, isLarge: boolean) => {
    if (isSmallWindow !== isSmall) {
      setIsSmallWindow(isSmall);
    }
  };

  useEffect(() => {
    let findS1 = columnFilterText;
    if (Utils.isNullOrEmpty(findS1)) {
      findS1 = null;
    }

    let res = null;
    if (findS1 == null) {
      setNonIgnoredColumnsCount(props.columnsList?.length ?? 0);
    } else {
      res = props.columnsList?.filter((s1) => _.startsWith(s1?.toLowerCase(), columnFilterText?.toLowerCase())) ?? null;

      if (props.includeAll && props.columnsList != null) {
        res = res ?? [];
        props.columnsList?.some((s1) => {
          if (!res.includes(s1)) {
            res.push(s1);
          }
        });
      }

      if (props.countIncludeAll) {
        setNonIgnoredColumnsCount(props.columnsList?.length ?? 0);
      } else {
        setNonIgnoredColumnsCount(res?.length ?? 0);
      }
    }

    if (lastSentRef.current) {
      if ((lastSentRef.current.text ?? '') !== (columnFilterText ?? '')) {
        //
      } else if (_.isEqual(lastSentRef.current.res, res) && lastSentRef.current.isIgnoreNonColumns == isIgnoreNonColumns && lastSentRef.current.prioritizeFeatureMappedColumns == prioritizeFeatureMappedColumns) {
        return;
      }
    }

    lastSentRef.current = lastSentRef.current ?? {};
    lastSentRef.current.res = res;
    lastSentRef.current.isIgnoreNonColumns = isIgnoreNonColumns;
    lastSentRef.current.prioritizeFeatureMappedColumns = prioritizeFeatureMappedColumns;
    lastSentRef.current.text = columnFilterText ?? '';

    props.onChange?.(res, isIgnoreNonColumns, findS1, prioritizeFeatureMappedColumns);
  }, [columnFilterText, isIgnoreNonColumns, props.columnsList, props.countIncludeAll, props.includeAll, prioritizeFeatureMappedColumns]);

  return (
    <>
      <WindowSizeSmart onChange={onChangeWinSize} />
      <span
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <span>Filter Columns By Name:</span>
        <span
          css={`
            margin-left: 10px;
            width: 200px;
            display: inline-block;
          `}
        >
          <Input
            value={columnFilterText ?? ''}
            onChange={(e) => {
              setColumnFilterText(e.target.value);
            }}
            allowClear={true}
          />
        </span>

        {!props.hideNonIgnoredColumns && (
          <span
            css={`
              margin-left: 20px;
            `}
            className={isSmallWindow ? s.checkboxesWrapper : null}
          >
            <Checkbox
              checked={!!isIgnoreNonColumns}
              onChange={(e) => {
                setIsIgnoreNonColumns(e.target.checked);
              }}
            >
              <span
                css={`
                  color: white;
                `}
              >
                Show only non-ignored columns
              </span>
            </Checkbox>
            {props.showPrioritizeFeatureMappedColumns && (
              <Checkbox
                checked={prioritizeFeatureMappedColumns}
                onChange={(e) => {
                  setPrioritizeFeatureMappedColumns(e.target.checked);
                }}
              >
                <span
                  css={`
                    color: white;
                  `}
                >
                  Show columns with feature mapping first
                </span>
              </Checkbox>
            )}
          </span>
        )}

        {!props.hideCount && (
          <span
            css={`
              margin-left: 20px;
              font-size: 14px;
            `}
          >
            <span>Active columns:</span>
            <span
              css={`
                margin-left: 5px;
              `}
            >
              {nonIgnoredColumnsCount}
            </span>
          </span>
        )}
      </span>
    </>
  );
});

export default FilterByColumns;
