import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Utils, { calcImgSrc } from '../../../core/Utils';
import { usePythonFunctionsOne } from '../../api/REUses';
import featureGroups from '../../stores/reducers/featureGroups';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import EditorElem from '../EditorElem/EditorElem';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import ResizeHeight from '../ResizeHeight/ResizeHeight';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./PythonFunctionDetail.module.css');
const sd = require('../antdUseDark.module.css');

interface IPythonFunctionDetailProps {}

const PythonFunctionDetail = React.memo((props: PropsWithChildren<IPythonFunctionDetailProps>) => {
  const { featureGroupsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
  }));

  //we do not support editing under a projectId / it is being used only for redirects
  let projectId = null;

  let nameUse = paramsProp?.get('pythonFunctionName');
  if (nameUse === '' || nameUse === '-') {
    nameUse = null;
  }
  const pythonFunctionsOne = usePythonFunctionsOne(nameUse);

  const dataList = useMemo(() => {
    let functionVariableMappings = [];
    pythonFunctionsOne?.functionVariableMappings?.forEach?.((mapping: any, index: number) => {
      functionVariableMappings.push(
        <div key={`variable-mapping-${index}`} style={{ margin: '0 8px' }}>
          <span
            css={`
              opacity: 0.8;
            `}
          >{`${mapping?.name} - `}</span>
          type: {mapping?.variable_type}, isRequired: {mapping?.is_required ? 'Yes' : 'No'}
        </div>,
      );
    });
    if (!functionVariableMappings.length) functionVariableMappings = null;

    return [
      {
        id: 111,
        name: 'Function Name: ',
        value: <CopyText>{pythonFunctionsOne?.functionName}</CopyText>,
        marginVert: null,
        valueColor: null,
        hidden: pythonFunctionsOne?.functionName == null,
      },
      {
        id: 2,
        name: 'Function Variable Mappings: ',
        value: functionVariableMappings,
        hidden: pythonFunctionsOne?.functionVariableMappings == null || functionVariableMappings == null,
      },
      {
        id: 3,
        name: 'Error: ',
        value: <span className={sd.styleTextRedColor}> {pythonFunctionsOne?.codeSource?.error}</span>,
        hidden: pythonFunctionsOne?.codeSource?.status !== 'FAILED',
      },
    ].filter((v1) => !v1.hidden);
  }, [nameUse, pythonFunctionsOne]);

  const createdAt = pythonFunctionsOne?.createdAt;

  useEffect(() => {
    featureGroups.memFeatureGroupsForPythonFunctions(true, nameUse);
  }, [featureGroupsParam, nameUse]);
  const fgAttachedList = useMemo(() => {
    return featureGroups.memFeatureGroupsForPythonFunctions(false, nameUse);
  }, [featureGroupsParam, nameUse]);

  const fgAttachedColumns = useMemo(() => {
    return (
      [
        {
          title: 'Created At',
          field: 'createdAt',
          render: (text, row, index) => {
            return text == null ? '-' : <DateOld always date={text} />;
          },
        },
        {
          title: 'Feature Group ID',
          field: 'featureGroupId',
          isLinked: true,
          render: (text, row, index) => {
            return <CopyText>{text}</CopyText>;
          },
        },
        {
          title: 'Name',
          field: 'tableName',
          render: (text, row, index) => {
            return text;
          },
        },
      ] as ITableExtColumn[]
    ).filter((v1) => !v1.hidden);
  }, []);

  const calcKey = useCallback((row) => {
    return row.featureGroupId;
  }, []);

  const calcLink = useCallback((row) => {
    return '/' + PartsLink.feature_group_detail + '/-/' + row.featureGroupId;
  }, []);

  return (
    <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px' }}>
      <NanoScroller onlyVertical>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          <span>{'Python Function Detail'}</span>
        </div>
        <div style={{ display: 'flex' }} className={sd.backdetail}>
          <div style={{ marginRight: '24px' }}>
            <img src={calcImgSrc('/imgs/modelIcon.png')} alt={''} style={{ width: '80px' }} />
          </div>
          <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
            <div style={{ marginBottom: '10px' }}>
              <DetailHeader>{pythonFunctionsOne?.name}</DetailHeader>
            </div>
            {dataList.map((d1) => (
              <div key={'val_' + d1.id} style={{ margin: (d1.marginVert ?? 5) + 'px 0' }}>
                <span>
                  <DetailName>{d1.name}</DetailName>
                  <DetailValue style={{ color: d1.valueColor ?? '#ffffff' }}>{d1.value}</DetailValue>
                </span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '10px' }}>
            {createdAt != null && (
              <div>
                <DetailCreatedAt>Created At: {<DateOld always date={createdAt} />}</DetailCreatedAt>
              </div>
            )}
            {!Utils.isNullOrEmpty(nameUse) && (
              <div
                css={`
                  margin-top: 10px;
                `}
              >
                <Link to={['/' + PartsLink.python_functions_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(nameUse), 'showEmbeddedNotebook=1&notebookId=' + encodeURIComponent(pythonFunctionsOne?.notebookId)]}>
                  <Button type={'primary'}>Edit</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        {!Utils.isNullOrEmpty(pythonFunctionsOne?.codeSource?.sourceCode) && (
          <div style={{ marginTop: '20px' }}>
            <div
              css={`
                display: flex;
                width: 100%;
                flex-direction: row;
                position: relative;
              `}
            >
              <div
                css={`
                  margin-bottom: 4px;
                  font-size: 17px;
                  white-space: nowrap;
                `}
              >
                Transform Spec:
              </div>
              {
                <div
                  css={`
                    position: absolute;
                    left: 0;
                    top: 100%;
                    margin-top: 4px;
                  `}
                >
                  <CopyText noText tooltipText={'Copy to Clipboard'}>
                    {pythonFunctionsOne?.codeSource?.sourceCode}
                  </CopyText>
                </div>
              }
            </div>
            <div
              css={`
                margin-top: 35px;
              `}
            >
              <ResizeHeight height={120} min={60} save={'fg_detail_editor_hh'}>
                {(height) => (
                  <div className={sd.pointerEventsNone}>
                    <EditorElem lineNumbers={true} lang="python" validateOnCall readonly={true} value={pythonFunctionsOne?.codeSource?.sourceCode} height={height - 15} />
                  </div>
                )}
              </ResizeHeight>
            </div>
          </div>
        )}
        {
          <div style={{ margin: '30px 0' }}>
            <div
              css={`
                display: flex;
                justify-content: space-between;
              `}
              className={sd.titleTopHeaderAfter}
              style={{ marginBottom: '14px' }}
            >
              <div>
                Attached Feature Groups
                <HelpIcon id={'fgs_using_template'} style={{ marginLeft: '4px' }} />
              </div>
              <Link to={['/' + PartsLink.feature_groups_add + '/' + (projectId ?? '-'), 'useType=python&pythonFunctionName=' + pythonFunctionsOne?.name]}>
                <Button type={'primary'}>Create New Feature Group</Button>
              </Link>
            </div>
            <TableExt isDetailTheme showEmptyIcon defaultSort={{ field: 'createdAt', isAsc: false }} dataSource={fgAttachedList} columns={fgAttachedColumns} calcKey={calcKey} calcLink={calcLink} />
          </div>
        }
      </NanoScroller>
    </div>
  );
});

export default PythonFunctionDetail;
