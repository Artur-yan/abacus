import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import { Popover } from 'antd';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import * as uuid from 'uuid';
import Utils, { ReactLazyExt } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useCDS, useFeatureGroup, useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import { CustomDSLifecycle } from '../../stores/reducers/customds';
import DataserverControlEditor from '../DataserverControlEditor/DataserverControlEditor';
import FeatureGroupPreviewPane from '../FeatureGroupPreviewPane/FeatureGroupPreviewPane';
import NullShow from '../NullShow/NullShow';
import SeeMore from '../SeeMore/SeeMore';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const styles = require('./EditorElem.module.css');
const sd = require('../antdUseDark.module.css');
const MonacoEditor = ReactLazyExt(() => import('react-monaco-editor'));
const MonacoDiffEditor = ReactLazyExt(() => import('react-monaco-editor'), 'MonacoDiffEditor');

interface IEditorElemProps {
  lang?: string;

  fullScreenZIndex?: number;
  list?: string[];
  listObjects?: string[];
  listProperties?: string[];
  dictObjects?: { [key: string]: string[] };
  extProperties?: { name?; value? }[];
  sample?: string;
  hideCtrlSpace?: boolean;

  hideErrors?: boolean;
  backTrasnparent?: boolean;
  onlyProgressAndErrors?: boolean;
  lineNumbers?: boolean;
  useSameSpace?: boolean;
  readonly?: boolean;
  isDiff?: boolean;
  value?: string;
  valueOriginal?: string;
  onChange?: (name, value) => void;
  askName?: boolean;
  defaultName?: string;
  height?: number;
  onFocus?: (isFocused: boolean) => void;
  useInternal?: boolean;
  hideExpandFGs?: boolean;
  useActionSet?: string;
  onRefreshingChange?: (isRefreshing: boolean) => void;
  showSmallHelp?: boolean;
  hideSample?: boolean;
  hideExpandFull?: boolean;
  readSure?: boolean;
  onChangeSelection?: (v1: string) => void;
  editorOptions?: { folding?: boolean; lineNumbers?: boolean };

  validateOnCall?: boolean;
  showPreview?: boolean;
  validateProjectId?: string;
  validateDatasetId?: string;
  validateType?: 'SELECT' | 'FILTER' | 'FEATUREGROUP';
  validateIsInclude?: boolean;

  validateFeatureTableName?: string;
  validateFeatureGroupId?: string;
  validateFeatureColumnName?: string;
  validateFeatureColumn?: boolean;

  featureGroupVersionId?: string;
  promiseResolve?: (table: string) => Promise<any>;
  seeMore?: boolean;
  errorMessage?: string;
  enableMouseWheel?: boolean;
  enableHandleMouseWheel?: boolean;
  verticalScroll?: string;
  lineHeight?: number;
}

export interface IEditorElemPreviewValue {
  columns?: string[];
  data?: any[];
  customColumnName?: string;
  limitedRowCount?: number;
  isAboveDataLimitingThreshold?: boolean;
  sqlTemplateRender?: string;
  fixedSql?: string;

  applyFix?: (value?: string) => void;
}

export interface IEditorElemPreviewContext {
  previewData?: IEditorElemPreviewValue;
  setPreviewData?: (newValue?: IEditorElemPreviewValue) => void;
}

export const EditorElemPreview = React.createContext<IEditorElemPreviewContext>({});

interface IEditorElemPreviewGridProps {
  projectId?: string;
  featureGroupId?: string;
  hideCDS?: boolean;
}

export const EditorElemPreviewGrid = React.memo(
  React.forwardRef((props: PropsWithChildren<IEditorElemPreviewGridProps>, ref: any) => {
    const { previewData } = useContext(EditorElemPreview);

    const projectFoundOne = useProject(props.projectId);
    const cdsFG = useFeatureGroup(null, props.featureGroupId);

    const cdsOne = useCDS();

    const isCdsActive = [CustomDSLifecycle.ACTIVE].includes(cdsOne?.status);
    const isNlp = projectFoundOne?.isNlp === true;

    const { showCustomDS, showCDSMsg, showCDSMsgText } = useMemo(() => {
      let showCDSMsgText = null;
      let isPythonFG = cdsFG?.featureGroupSourceType?.toUpperCase() === 'PYTHON';
      let showCustomDS = !isNlp && !isPythonFG;
      if (showCustomDS === true && previewData?.isAboveDataLimitingThreshold === true) {
        if (!isCdsActive) {
          showCDSMsgText = Constants.flags.cds_too_large;
        }
      } else if (showCustomDS === true && previewData?.isAboveDataLimitingThreshold === false) {
        showCustomDS = false;
      }

      let showCDSMsg = showCDSMsgText != null;
      if (props.hideCDS) {
        showCustomDS = false;
        showCDSMsg = false;
        showCDSMsgText = null;
      }
      return {
        showCustomDS,
        showCDSMsg,
        showCDSMsgText,
      };
    }, [isCdsActive, cdsFG, isNlp, previewData, props.hideCDS]);

    const previewDataColumns = useMemo(() => {
      return previewData?.columns?.map((c1, c1ind) => {
        let name1 = c1;
        if (c1?.toUpperCase() === '_CUSTOM_COLUMN' && !Utils.isNullOrEmpty(previewData?.customColumnName)) {
          name1 = previewData?.customColumnName;
        }
        const textColumnWidth = 170;
        const charsToShow = 20;
        return {
          title: name1,
          field: c1,
          forceNoWrap: true,
          render: (text, row, index, isLarge) => {
            // TODO: add ability for table to show ...
            text = row?.[c1];
            if (_.isObject(text) && text != null) {
              try {
                let s1 = JSON.stringify(text);
                text = s1;
              } catch (e1) {
                text = '{...}';
              }
            }
            if (text && _.isString(text)) {
              return (
                <Popover overlayClassName="preview-col-text" color="#0c121b" placement="top" content={text} {...(text?.length < charsToShow ? { open: false } : {})}>
                  <span
                    css={`
                      width: ${textColumnWidth}px;
                      display: flex;
                    `}
                  >
                    <span className={styles.colText}>{text}</span>
                  </span>
                </Popover>
              );
            } else {
              if (text == null) {
                return <NullShow value={null} />;
              }
              return text;
            }
          },
        } as ITableExtColumn;
      });
    }, [previewData?.columns]);

    const previewDataList = useMemo(() => {
      return previewData?.data?.slice(0, 5);
    }, [previewData?.data]);

    const enters = (s1) => {
      if (s1 == null) {
        return s1;
      }

      if (_.isString(s1)) {
        if (s1.indexOf('\n')) {
          let ss = s1.split('\n');
          return ss.map((s1, ind) => <div key={'s' + ind}>{s1}</div>);
        } else {
          return s1;
        }
      } else {
        return s1;
      }
    };

    const onClickApplyFix = (e) => {
      previewData?.applyFix?.(previewData?.fixedSql);
    };

    return (
      <div
        css={`
          position: relative;
          margin: 30px 20px;
        `}
      >
        {showCustomDS && (
          <div
            css={`
              font-size: 17px;
              margin-bottom: 5px;
            `}
          >
            <div
              css={`
                margin-top: 7px;
                margin-bottom: 11px;
              `}
            >
              <DataserverControlEditor />
            </div>
            {(previewData?.data != null || previewData?.sqlTemplateRender != null) && (
              <div>Quick Preview{previewData?.limitedRowCount == null || !_.isNumber(previewData?.limitedRowCount) ? null : ` (Max ${Utils.prettyPrintNumber(previewData?.limitedRowCount)} rows processed)`}</div>
            )}
          </div>
        )}
        {showCDSMsg && (
          <div
            css={`
              margin-top: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
              color: #d5d50b;
              margin-bottom: 15px;
            `}
          >
            {showCDSMsgText}
          </div>
        )}
        {previewData?.fixedSql != null && (
          <div
            css={`
              padding: 4px 10px;
              text-align: center;
              margin: 5px 0;
              background: rgb(101, 101, 46);
              border: 1px solid #b2b223;
              color: white;
              font-size: 13px;
              border-radius: 4px;
            `}
          >
            <div>
              <b
                css={`
                  margin-right: 6px;
                `}
              >
                Original SQL had a syntax error - Fixed SQL is::
              </b>
              {previewData?.fixedSql}
            </div>
            {previewData?.applyFix != null && (
              <div
                css={`
                  text-align: center;
                  margin-top: 10px;
                `}
              >
                <Button size={'small'} type={'primary'} onClick={onClickApplyFix}>
                  Apply Fix
                </Button>
              </div>
            )}
          </div>
        )}
        {previewData?.data != null && <TableExt showNulls showEmptyIcon={true} dataSource={previewDataList} columns={previewDataColumns} />}
        {!Utils.isNullOrEmpty(previewData?.sqlTemplateRender) && (
          <div
            css={`
              border: 1px solid rgba(255, 255, 255, 0.7);
              border-radius: 4px;
              padding: 10px;
              font-family: monospace;
              white-space: pre-wrap;
            `}
          >
            {enters(previewData?.sqlTemplateRender)}
          </div>
        )}
      </div>
    );
  }),
);

const disposeRef = (ref) => {
  if (ref?.current !== null) {
    ref.current?.dispose?.();
    ref.current = null;
  }
};

const EditorElem = React.memo(
  React.forwardRef((props: PropsWithChildren<IEditorElemProps>, ref: any) => {
    const { setPreviewData } = useContext(EditorElemPreview);
    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
    const [name, setName] = useState(props.defaultName ?? '');
    const [codeValue, setCodeValue] = useState(props.value ?? '');
    const [isMount, setIsMount] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [warningMsg, setWarningMsg] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isPreviewWork, setIsPreviewWork] = useState(false);
    const [processingLabel, setProcessingLabel] = useState(null);
    const [showFull, setShowFull] = useState(false);

    const [intValue, setIntValue] = useState('');
    const [intMonaco, setIntMonaco] = useState(null);
    const [intEditor, setIntEditor] = useState(null);

    const refLang = useRef(uuid.v1());
    const refTimeCheck = useRef(null);
    const refValidateLastId = useRef(null);

    const editorElemSetValue = useCallback(
      (name, value1) => {
        if (name === props.useActionSet) {
          if (props.useInternal) {
            setIntValue(value1);
          } else {
            setCodeValue(value1);
          }
        }
      },
      [props.useActionSet, props.useInternal],
    );

    useEffect(() => {
      if (!Utils.isNullOrEmpty(props.useActionSet)) {
        let unR = REActions.editorElemSetValue.listen(editorElemSetValue);

        return () => {
          unR();
        };
      }
    }, [props.useActionSet, editorElemSetValue]);

    const intDoValidate = useCallback(() => {
      setPreviewData?.(null);
      setIsValidating(true);

      return new Promise((resolve) => {
        checkSql(false);

        setTimeout(() => {
          const doWork = () => {
            setIsRefreshing((v1) => {
              if (v1) {
                setTimeout(() => {
                  doWork();
                }, 200);
              } else {
                setErrorMsg((verr) => {
                  const isOk = verr == null || verr === '';
                  resolve(isOk);
                  setIsValidating(false);

                  return verr;
                });
              }
              return v1;
            });
          };

          doWork();
        }, 0);
      });
    }, [errorMsg, isRefreshing, props.validateProjectId, props.validateDatasetId, props.validateType, props.validateIsInclude, props.validateFeatureColumn, props.validateFeatureColumnName]);

    useImperativeHandle(
      ref,
      () => ({
        doProcessing: (label: string, cbProcess: () => Promise<string>) => {
          setProcessingLabel(label || 'Processing...');
          setIsValidating(true);

          cbProcess().then((err) => {
            setProcessingLabel(null);
            setIsValidating(false);
            setSuccessMessage(null);
            if (Utils.isNullOrEmpty(err)) {
              setErrorMsg(null);
            } else {
              setErrorMsg('' + err);
              setPreviewData?.(null);
            }
          });
        },
        setIsProcessing: (isProcessing: boolean, label?: string) => {
          if (isProcessing) {
            setProcessingLabel(label || 'Processing...');
            setIsValidating(true);
          } else {
            setProcessingLabel(null);
            setIsValidating(false);
          }
        },
        doFormat: () => {
          return new Promise((resolve) => {
            const cb2 = (v1) => {
              if (_.trim(v1 || '') !== '') {
                REClient_.client_()._formatSQL(v1, (err, res) => {
                  if (!err && res?.success && !Utils.isNullOrEmpty(res?.result)) {
                    onChange(res?.result, null);
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                });
              } else {
                resolve(false);
              }

              return v1;
            };

            if (props.useInternal) {
              setIntValue(cb2);
            } else {
              setCodeValue(cb2);
            }
          });
        },
        doSetValue: (value1) => {
          if (props.useInternal) {
            setIntValue(value1);
          } else {
            setCodeValue(value1);
          }
        },
        isOk: () => {
          if (isRefreshing) {
            return false;
          } else {
            return errorMsg == null || errorMsg === '';
          }
        },
        doPreviewTemplateSql: (templateSql, templateVariables, featureGroupTemplateId) => {
          setPreviewData?.(null);
          return new Promise((resolve) => {
            REClient_.client_().previewFeatureGroupTemplateResolution(
              templateSql == null ? featureGroupTemplateId : null,
              templateSql,
              templateSql == null ? null : templateVariables,
              templateSql != null ? null : templateVariables,
              true,
              (err, res) => {
                let r1 = res?.result?.resolvedSql;
                setPreviewData?.({ sqlTemplateRender: r1 });

                let err1 = res?.result?.sqlError ?? res?.sqlError;
                resolve(err1);
              },
            );
          });
        },
        doPreview: (forceSql?: string, applyFix?: (value) => void) => {
          return new Promise((resolve) => {
            setIsPreviewWork(true);
            checkSql(undefined, forceSql, applyFix);

            setTimeout(() => {
              const doWork = () => {
                setIsRefreshing((v1) => {
                  if (v1) {
                    setTimeout(() => {
                      doWork();
                    }, 200);
                  } else {
                    setIsPreviewWork(false);
                    resolve(null);
                  }
                  return v1;
                });
              };
              doWork();
            }, 0);
          });
        },
        doValidate: () => {
          return intDoValidate();
        },
      }),
      [intDoValidate, errorMsg, isRefreshing, props.validateProjectId, props.validateDatasetId, props.validateType, props.validateIsInclude, props.validateFeatureColumn, props.validateFeatureColumnName],
    );

    const canDoValidate = () => {
      const isSql = (props.lang ?? 'sql')?.toLowerCase() === 'sql';
      const isFeatureGroup = props.validateType === 'FEATUREGROUP';
      if (!isSql) {
        return false;
      }
      if (isFeatureGroup) {
        return true;
      }
      if (!props.validateProjectId || !props.validateDatasetId) {
        return false;
      }
      return true;
    };

    const checkSql = (showPreview = true, forceSql?: string, applyFix?: (value) => void) => {
      const isFeatureGroup = props.validateType === 'FEATUREGROUP';
      if (!isFeatureGroup && (!props.validateProjectId || !props.validateDatasetId)) {
        return;
      }

      setWarningMsg(null);
      setErrorMsg(null);
      setSuccessMessage(null);
      setIsRefreshing(true);
      props.onRefreshingChange?.(true);

      if (refTimeCheck.current != null) {
        clearTimeout(refTimeCheck.current);
      }

      let lastIdValidate = uuid.v1();
      refValidateLastId.current = lastIdValidate;

      refTimeCheck.current = setTimeout(() => {
        if (refValidateLastId.current != lastIdValidate) {
          return;
        }

        const cb2 = (v1) => {
          const cbValidateFeatureGroupVersion = (err, res) => {
            setIsRefreshing(false);
            props.onRefreshingChange?.(false);
            if (err || !res?.success) {
              setErrorMsg(err || Constants.errorDefault);
              setPreviewData?.(null);
              return;
            }
            setSuccessMessage('Success!');
          };

          const cbValidate = (isFG, showErrorNotification, err, res) => {
            setIsRefreshing(false);
            props.onRefreshingChange?.(false);
            if (refValidateLastId.current != lastIdValidate) {
              return;
            }

            if (err || !res?.success) {
              // only enabling for _getSQLPreviewData, might need to enable for _getFeatureGroupCustomColPreview and _validateSQL as well
              if (showErrorNotification) {
                REActions.addNotificationError(err || Constants.errorDefault);
              }
            } else {
              let fixedSql = res?.result?.fixedSql;
              let err1 = isFG ? res?.result?.errorDescription : res?.result?.error;
              let isCustomError = false;
              let originalSqlError = res?.result?.originalSqlError;
              if (!Utils.isNullOrEmpty(originalSqlError)) {
                isCustomError = true;
                err1 = originalSqlError;
              } else if (isFG) {
                if (res?.result?.isSqlError === true) {
                  isCustomError = true;
                  err1 = err1 || 'Error';
                }
              } else {
                if (res?.result?.isValid === false) {
                  isCustomError = true;
                  err1 = err1 || 'Error';
                }
              }

              if (!err1) {
                isCustomError = false;
              }

              const doSetData = () => {
                if (res?.result?.data != null && showPreview) {
                  let columns1 = res?.result?.columns;
                  let data1 = res?.result?.data;
                  if (isFG) {
                    data1 = data1?.map((d1) => {
                      let res: any = {};
                      columns1?.some((c1, c1ind) => {
                        res[c1] = d1?.[c1ind];
                      });
                      return res;
                    });
                  }

                  setName((n1) => {
                    setPreviewData?.({
                      applyFix: applyFix,
                      fixedSql: fixedSql,
                      columns: columns1,
                      data: data1,
                      customColumnName: n1,
                      limitedRowCount: res?.result?.limitedRowCount ?? null,
                      isAboveDataLimitingThreshold: res?.result?.isAboveDataLimitingThreshold,
                    });

                    return n1;
                  });
                }
              };

              setWarningMsg(res?.result?.warning);
              if (err1 != null && err1 !== '') {
                setErrorMsg(err1);
                setPreviewData?.(null);

                if (isCustomError && !Utils.isNullOrEmpty(fixedSql)) {
                  doSetData();
                }
              } else {
                doSetData();
              }
            }
          };

          if (props.validateFeatureColumn) {
            REClient_.client_()._getFeatureGroupCustomColPreview(props.validateFeatureGroupId, props.validateFeatureColumnName, v1, 0, 100, cbValidate.bind(null, true, false));
          } else if (props.featureGroupVersionId) {
            REClient_.client_()._getFeatureGroupVersionData(props.featureGroupVersionId, 0, 0, 0, 9999, null, forceSql ?? v1, null, null, null, null, true, null, cbValidateFeatureGroupVersion);
          } else if (isFeatureGroup) {
            REClient_.client_()._getSQLPreviewData(props.validateFeatureTableName, forceSql ?? v1, 0, 20, 0, 100, !showPreview, cbValidate.bind(null, true, true));
          } else {
            REClient_.client_()._validateSQL(
              props.validateProjectId,
              props.validateDatasetId,
              props.validateType,
              props.validateIsInclude == null ? null : props.validateIsInclude ? 'INCLUDE' : 'EXCLUDE',
              v1,
              cbValidate.bind(null, false, false),
            );
          }

          return v1;
        };

        if (props.useInternal) {
          setIntValue(cb2);
        } else {
          setCodeValue(cb2);
        }
      }, 500);
    };

    useEffect(() => {
      if (props.defaultName != null) {
        setName(props.defaultName);
      }
    }, [props.defaultName]);

    useEffect(() => {
      setErrorMsg(props.errorMessage);
    }, [props.errorMessage]);

    const createDependencyProposals = useCallback(
      (dictObjects, propslist, listObjects, listProperties, extProperties, range, word, textUntilPosition) => {
        // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
        // here you could do a server side lookup
        const monaco = intMonaco;

        let propsSpecial = null;
        if (dictObjects != null) {
          propsSpecial = dictObjects[textUntilPosition];
        }

        let list1 = [
          {
            list: propslist,
            kind: monaco.languages.CompletionItemKind.Value,
          },
          {
            list: listObjects,
            kind: monaco.languages.CompletionItemKind.Struct,
          },
          {
            list: listProperties,
            kind: monaco.languages.CompletionItemKind.Property,
          },
          {
            isExt: true,
            list: extProperties,
            kind: monaco.languages.CompletionItemKind.Property,
          },
        ];
        if (propsSpecial != null) {
          list1 = [
            {
              list: propsSpecial,
              kind: monaco.languages.CompletionItemKind.Property,
            },
          ];
        }

        let res: any = list1.map((d1) => {
          return (d1.list ?? []).map((s1) => {
            let o1: any = null;

            let desc1 = null;
            if (_.isObject(s1)) {
              o1 = s1;

              s1 = o1.name;
            }

            let label1 = s1;
            let text1 = s1;
            if (o1 != null) {
              label1 = o1.name;
              text1 = o1.value ?? label1;
              desc1 = o1.desc;
            } else if (d1.isExt) {
              label1 = s1.name ?? s1;
              text1 = s1.value ?? s1;
              desc1 = s1.desc;
            }

            return {
              label: label1,
              kind: d1.kind,
              detail: desc1,
              insertText: text1,
              range: range,
            };
          });
        });

        res = res == null ? null : _.flatten(res);
        return res;
      },
      [intMonaco, props.list, props.listObjects, props.listProperties, props.dictObjects],
    );

    const providerMonaco = useRef(null);
    const providerMonaco2 = useRef(null);
    const providerMonaco3 = useRef(null);

    useEffect(() => {
      let editor = intEditor;
      if (!editor || props.isDiff) {
        return;
      }

      [refSel1, refSel2].forEach((ref) => disposeRef(ref));

      refSel1.current = editor?.onDidChangeCursorPosition((e) => {
        if (props.onChangeSelection != null) {
          let selectedText = editor?.getModel()?.getValueInRange(editor?.getSelection());
          if (selectedText === editor?.getValue()) {
            selectedText = '';
          }
          props.onChangeSelection?.(selectedText);
        }
      });
      refSel2.current = editor.onDidChangeCursorSelection((e) => {
        if (props.onChangeSelection != null) {
          let selectedText = editor?.getModel()?.getValueInRange(editor?.getSelection());
          if (selectedText === editor?.getValue()) {
            selectedText = '';
          }
          props.onChangeSelection?.(selectedText);
        }
      });

      return () => {
        [refSel1, refSel2].forEach((ref) => disposeRef(ref));
      };
    }, [intEditor, props.onChangeSelection, props.isDiff]);

    useEffect(() => {
      const monaco = intMonaco;
      if (!monaco) {
        return;
      }

      [providerMonaco, providerMonaco2, providerMonaco3].forEach((ref) => disposeRef(ref));

      const doWork = async () => {
        const allLangs = await monaco.languages.getLanguages();
        let allLangsOne = allLangs.find(({ id }) => id === (props.lang ?? 'sql'));
        const { conf, language: jsLang } = allLangsOne?.loader == null ? { conf: null, language: null } : await allLangsOne.loader();

        let useIntLang = conf == null && !Utils.isNullOrEmpty(props.lang);

        refLang.current = useIntLang ? props.lang : uuid.v1();

        let colors1: any = {
          'editor.lineHighlightBackground': '#4990E220',
          'editor.selectionBackground': '#4990E290',
          'editor.inactiveSelectionBackground': '#4990E215',
        };
        if (props.readSure || props.backTrasnparent) {
          colors1['editor.background'] = '#00000000';
        }

        monaco.editor.defineTheme(refLang.current + 'myTheme', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: colors1,
        });

        if (!useIntLang) {
          monaco.languages.register({ id: refLang.current });
        }

        if (jsLang && conf) {
          providerMonaco2.current = monaco.languages.setMonarchTokensProvider(refLang.current, jsLang);
          providerMonaco3.current = monaco.languages.setLanguageConfiguration(refLang.current, conf);
        }
        if (refLang.current) {
          providerMonaco.current = monaco.languages.registerCompletionItemProvider(refLang.current, {
            provideCompletionItems: function (model, position) {
              // find out if we are completing a property in the 'dependencies' object.
              let textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
              let match = textUntilPosition.match(/\b([a-zA-Z0-9-_#:]+)\.$/);
              if (match) {
                textUntilPosition = match?.[1];
              } else {
                let match = textUntilPosition.match(/\b([a-zA-Z0-9-_#:]+)\.([a-zA-Z0-9-_#:]+)$/);
                if (match) {
                  textUntilPosition = match?.[1];
                } else {
                  textUntilPosition = null;
                }
              }
              let word = model.getWordUntilPosition(position);
              let range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };

              return new Promise((resolve) => {
                if (props.promiseResolve != null && !Utils.isNullOrEmpty(textUntilPosition)) {
                  props.promiseResolve(textUntilPosition).then((dictObjects) => {
                    resolve({
                      suggestions: createDependencyProposals(dictObjects ?? props.dictObjects, props.list, props.listObjects, props.listProperties, props.extProperties, range, word, textUntilPosition),
                    });
                  });
                } else {
                  resolve({
                    suggestions: createDependencyProposals(props.dictObjects, props.list, props.listObjects, props.listProperties, props.extProperties, range, word, textUntilPosition),
                  });
                }
              });
            },
          });
        }

        return true;
      };
      doWork().then(() => {
        forceUpdate();
      });

      return () => [refFocus, refBlur, providerMonaco, providerMonaco2, providerMonaco3].forEach((ref) => disposeRef(ref));
    }, [intMonaco, props.list, props.readSure, props.backTrasnparent, props.listProperties, props.listObjects, props.dictObjects, createDependencyProposals, props.lang, props.promiseResolve]);

    const refSel1 = useRef(null);
    const refSel2 = useRef(null);
    const refBlur = useRef(null);
    const refFocus = useRef(null);

    const editorDidMount = (editor, monaco) => {
      setIntMonaco(monaco);
      setIntEditor(editor);
      setTimeout(() => {
        setIsMount(true);
      }, 200);

      [refFocus, refBlur].forEach((ref) => disposeRef(ref));

      if (!props.isDiff) {
        refFocus.current = editor.onDidFocusEditorWidget(() => {
          props.onFocus?.(true);
        });
        refBlur.current = editor.onDidBlurEditorWidget(() => {
          props.onFocus?.(false);
        });
      }
    };

    const onChange = (newValue, e) => {
      setCodeValue(newValue);

      if (props.useInternal) {
        setIntValue(newValue);
        props.onChange?.(newValue, null);
      } else {
        props.onChange?.(name, newValue);
      }

      if (_.trim(newValue || '') !== '') {
        if (!props.validateOnCall) {
          checkSql();
        }
      } else {
        setErrorMsg(null);
        setSuccessMessage(null);
      }
    };

    useEffect(() => {
      if (props.useInternal) {
        if (props.value !== intValue) {
          setIntValue(props.value);
        }
      }

      setCodeValue((currentCodeValue) => {
        let newCodeValue = currentCodeValue;
        if (Utils.isNullOrEmpty(currentCodeValue)) {
          newCodeValue = props?.value ?? '';
        }
        return newCodeValue;
      });
    }, [props.useInternal, props.value]);

    let code = props.value ?? '';
    if (props.useInternal) {
      code = intValue;
    }

    let codeOriginal = props.valueOriginal ?? '';
    const optionsRef = useRef(null);
    const options: any = useMemo(() => {
      let res: any = {
        minimap: {
          enabled: false,
        },
        ...(props.lineHeight && { lineHeight: props.lineHeight }),
        automaticLayout: true,
        contextmenu: true,
        dragAndDrop: false,
        hover: false,
        scrollbar: {
          alwaysConsumeMouseWheel: props.enableMouseWheel !== false,
          handleMouseWheel: props.enableHandleMouseWheel !== false,
          ...(props.verticalScroll && { vertical: props.verticalScroll }),
        },
        quickSuggestions: false,
        wordWrap: 'on',
        renderLineHighlight: 'none',
        colorDecorators: true,
        lineDecorationsWidth: 0,
        folding: false,
        readOnly: !!props.readonly,
      };

      if (props.lineNumbers || props.editorOptions?.lineNumbers) {
        delete res.lineDecorationsWidth;
      } else {
        res = _.assign(res, {
          glyphMargin: false,
          lineNumbersMinChars: 0,
          lineNumbers: 'off',
        });
      }

      if (props.editorOptions?.folding) {
        res.folding = true;
        res.showFoldingControls = 'always';
        res.glyphMargin = true;
        res.renderValidationDecorations = 'on';
      }

      if (optionsRef.current != null && _.isEqual(optionsRef.current, res)) {
        res = optionsRef.current;
      } else {
        optionsRef.current = res;
      }

      return res;
    }, [props.readonly, props.lineNumbers, props.editorOptions]);

    const HH = props.height ?? 300;
    const helpHH = !props.hideSample ? 110 : 30;

    const msgHHmax = 80;
    let sameHH = 0;
    if (props.useSameSpace) {
      if (props.showSmallHelp) {
        sameHH += 46;
      }
      if (!Utils.isNullOrEmpty(errorMsg) && !props.hideErrors) {
        sameHH += msgHHmax;
      }
      if (!Utils.isNullOrEmpty(warningMsg) && !props.hideErrors) {
        sameHH += msgHHmax;
      }
      if (isPreviewWork || isValidating) {
        sameHH += 50;
      }
    }

    const MonEditor = props.isDiff ? MonacoDiffEditor : MonacoEditor;

    let elem1 = (
      <React.Suspense fallback={<div></div>}>
        <MonEditor
          width="100%"
          height={HH - (props.askName ? helpHH : 0) - sameHH}
          language={isMount ? refLang.current : props.lang ?? 'sql'}
          theme={isMount ? refLang.current + 'myTheme' : 'vs-dark'}
          original={codeOriginal}
          value={code}
          options={options}
          onChange={onChange}
          editorDidMount={editorDidMount}
        />
      </React.Suspense>
    );

    const onChangeName = (e) => {
      let v1 = e.target.value;
      setName(v1);
      props.onChange?.(v1, codeValue);
    };

    const onClickExpandFull = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowFull(true);
    };

    const optionsFullRef = useRef(null);
    const optionsFull: any = useMemo(() => {
      let res: any = {
        minimap: {
          enabled: true,
        },
        automaticLayout: true,
        contextmenu: true,
        dragAndDrop: false,
        hover: false,
        quickSuggestions: false,
        wordWrap: 'on',
        colorDecorators: true,
        readOnly: !!props.readonly,
      };

      if (props.editorOptions?.lineNumbers) {
        res.lineNumbers = 'on';
      }
      if (props.editorOptions?.folding) {
        res.folding = true;
        res.showFoldingControls = 'always';
        res.glyphMargin = true;
        res.renderValidationDecorations = 'on';
      }

      if (optionsFullRef.current != null && _.isEqual(optionsFullRef.current, res)) {
        res = optionsFullRef.current;
      } else {
        optionsFullRef.current = res;
      }

      return res;
    }, [props.readonly, props.editorOptions]);

    const canDoVal = canDoValidate();
    const fullElem = useMemo(() => {
      let editorElem = (height) => {
        const showError = !Utils.isNullOrEmpty(errorMsg) && !props.hideErrors;
        const showWarning = !Utils.isNullOrEmpty(warningMsg) && !props.hideErrors;
        const showSuccessMessage = !Utils.isNullOrEmpty(successMessage) && !props.hideErrors;
        return (
          <div
            css={`
              margin-right: 10px;
            `}
          >
            <React.Suspense fallback={<div></div>}>
              <MonEditor
                width="100%"
                height={height - 46 + (!props.readonly ? -70 : 0)}
                language={isMount ? refLang.current : props.lang ?? 'sql'}
                theme={isMount ? refLang.current + 'myTheme' : 'vs-dark'}
                original={codeOriginal}
                value={code}
                options={optionsFull}
                onChange={onChange}
              />
            </React.Suspense>
            {showError && (
              <div
                css={`
                  color: #ff9090;
                  font-size: 13px;
                  margin: 10px;
                  ${props.useSameSpace ? `height: ${msgHHmax - 10 * 2}px; overflow-y: hidden;` : ''}
                `}
              >
                {errorMsg}
              </div>
            )}
            {showSuccessMessage && (
              <div
                css={`
                  color: #6ddc49;
                  font-size: 13px;
                  margin: 10px;
                  ${props.useSameSpace ? `height: ${msgHHmax - 10 * 2}px; overflow-y: hidden;` : ''}
                `}
              >
                {successMessage}
              </div>
            )}
            {showWarning && (
              <div
                css={`
                  color: #ceca5a;
                  font-size: 13px;
                  margin: 10px;
                  ${props.useSameSpace ? `height: ${msgHHmax - 10 * 2}px; overflow-y: hidden;` : ''}
                `}
              >
                {warningMsg}
              </div>
            )}
            {isPreviewWork && (
              <div
                css={`
                  color: #213a93;
                  font-size: 13px;
                  margin: 10px;
                `}
              >
                <div
                  css={`
                    width: 200px;
                    margin: 0 auto;
                  `}
                >
                  <div
                    css={`
                      margin-bottom: 4px;
                      text-align: center;
                    `}
                  >
                    Preparing Preview...
                  </div>
                  <div>
                    <LinearProgress style={{ backgroundColor: 'transparent', height: 6 }} />
                  </div>
                </div>
              </div>
            )}
            {isValidating && (
              <div
                css={`
                  color: #213a93;
                  font-size: 13px;
                  margin: 10px;
                `}
              >
                <div
                  css={`
                    width: 200px;
                    font-size: 13px;
                    margin: 0 auto;
                  `}
                >
                  <div
                    css={`
                      margin-bottom: 4px;
                      text-align: center;
                    `}
                  >
                    {processingLabel ?? 'Validating...'}
                  </div>
                  <div>
                    <LinearProgress style={{ backgroundColor: 'transparent', height: 6 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      };

      let splitElem = (height) => editorElem(height);
      if (!props.hideExpandFGs) {
        splitElem = (height) => (
          // @ts-ignore
          <SplitPane
            primary={'second'}
            split={'vertical'}
            minSize={200}
            defaultSize={Utils.dataNum('expandsql_fg_preview', 400)}
            onChange={(v1) => {
              Utils.dataNum('expandsql_fg_preview', undefined, v1);
            }}
          >
            {editorElem(height)}
            <div
              css={`
                height: ${height - 46}px;
                padding-left: 10px;
                border-left: 1px solid rgba(255, 255, 255, 0.2);
              `}
            >
              <FeatureGroupPreviewPane height={height - 46} />
            </div>
          </SplitPane>
        );
      }

      const onClickValidate = (e) => {
        e.preventDefault();
        e.stopPropagation();
        intDoValidate();
      };

      const onClickClose = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setErrorMsg(null);
        setSuccessMessage(null);
        setShowFull(false);
      };

      return ReactDOM.createPortal(
        <>
          {showFull && (
            <div
              css={`
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1100;
              `}
            >
              &nbsp;
            </div>
          )}
          {showFull && (
            <div
              className={'useDark'}
              css={`
                z-index: 1100;
                display: flex;
                flex-flow: column;
                padding: 20px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.85);
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                bottom: 20px;
                border-radius: 15px;
                background: rgb(19, 27, 38);
                border: 1px solid rgba(255, 255, 255, 0.4);
              `}
            >
              <AutoSizer disableWidth>
                {({ height }) => (
                  <div>
                    <div
                      css={`
                        height: ${height - 46}px;
                        position: relative;
                      `}
                    >
                      {splitElem(height)}
                    </div>
                    <div
                      css={`
                        margin-top: 10px;
                        display: flex;
                      `}
                    >
                      {canDoVal && !props.readonly && (
                        <Button
                          type={'default'}
                          css={`
                            width: 280px;
                            margin-right: 10px;
                          `}
                          onClick={onClickValidate}
                        >
                          Validate
                        </Button>
                      )}
                      <Button
                        type={'primary'}
                        css={`
                          width: 100%;
                        `}
                        onClick={onClickClose}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </AutoSizer>
            </div>
          )}
        </>,
        document.getElementById('container'),
      );
    }, [showFull, isMount, code, props.readonly, props.lang, refLang.current, isValidating, warningMsg, errorMsg, canDoVal, optionsFull]);

    const expandHH = 25;
    let expandFullElem =
      props.hideExpandFull !== true ? (
        <div
          className={sd.pointerEventsAll}
          onClick={onClickExpandFull}
          css={`
            cursor: pointer;
            padding: 3px 9px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 12px;
            position: absolute;
            right: 0;
            top: ${-expandHH}px;
            height: ${expandHH}px;
            background: #1e1e1e;
            border-top-left-radius: 4px;
            border: rgba(255, 255, 255, 0.3);
            &:hover {
              background: #2f2f2f;
              color: rgba(255, 255, 255, 1);
            }
          `}
        >
          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faExpandArrowsAlt').faExpandArrowsAlt} transform={{ size: 14, x: 0, y: 0 }} />
          <span
            css={`
              margin-left: 6px;
            `}
          >
            Expand Full Screen
          </span>
          {fullElem}
        </div>
      ) : null;

    if (props.onlyProgressAndErrors) {
      elem1 = (
        <div
          css={`
            display: none;
          `}
        >
          {elem1}
        </div>
      );

      expandFullElem = null;
    }

    if (props.askName) {
      elem1 = (
        <div
          css={`
            display: flex;
          `}
        >
          <div
            css={`
              .ant-input {
                background-color: #1e1e1e !important;
                border-radius: 0;
                border: 1px solid rgba(255, 255, 255, 0.1);
              }
            `}
          >
            <Input
              value={name}
              onChange={onChangeName}
              css={`
                color: white;
                width: 140px;
                border: 1px solid rgba(255, 255, 255, 0.1);
              `}
            />
            <div
              css={`
                margin-top: 3px;
                color: rgba(255, 255, 255, 0.4);
                font-size: 13px;
                text-align: center;
              `}
            >
              Column Name
            </div>
          </div>
          <div>
            <span
              css={`
                line-height: 1.9;
                color: white;
                font-size: 14px;
                margin: 0 8px 0 8px;
              `}
            >
              =
            </span>
          </div>
          <div
            css={`
              display: block;
              flex: 1;
              padding: 4px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background-color: #1e1e1e;
            `}
          >
            {elem1}
            {isPreviewWork && (
              <div
                css={`
                  color: #213a93;
                  font-size: 13px;
                  margin: 10px;
                `}
              >
                <div
                  css={`
                    width: 200px;
                    font-size: 13px;
                    margin: 0 auto;
                  `}
                >
                  <div
                    css={`
                      margin-bottom: 4px;
                      text-align: center;
                    `}
                  >
                    Preparing Preview...
                  </div>
                  <div>
                    <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                  </div>
                </div>
              </div>
            )}
            {isValidating && (
              <div
                css={`
                  color: #213a93;
                  font-size: 13px;
                  margin: 10px;
                `}
              >
                <div
                  css={`
                    width: 200px;
                    font-size: 13px;
                    margin: 0 auto;
                  `}
                >
                  <div
                    css={`
                      margin-bottom: 4px;
                      text-align: center;
                    `}
                  >
                    {processingLabel ?? 'Validating...'}
                  </div>
                  <div>
                    <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                  </div>
                </div>
              </div>
            )}

            {props.askName && (
              <div
                css={`
                  margin-top: 5px;
                  color: rgba(255, 255, 255, 0.4);
                  font-size: 13px;
                  text-align: center;
                  height: ${helpHH}px;
                  border-top: 1px solid rgba(255, 255, 255, 0.1);
                  padding-top: 8px;
                `}
              >
                {!props.hideSample && (
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 14px;
                      color: #337dee;
                      margin-bottom: 5px;
                    `}
                  >
                    SQL Statement (CASE Example)
                  </div>
                )}
                {!props.hideSample && (
                  <div
                    css={`
                      padding: 0 20px;
                      font-family: Matter;
                      font-size: 14px;
                    `}
                  >
                    {'CASE WHEN Col1 == "Example" THEN "ColVal1" WHEN Col2 LIKE "%fuzzy_search%" THEN "ColVal2" ELSE "ColVal3" END'}
                  </div>
                )}
                <div
                  css={`
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: ${!props.hideSample ? 5 : 0}px;
                    font-size: 13px;
                    text-align: center;
                  `}
                >
                  (Press Ctrl+Space to autocomplete name of columns)
                </div>
              </div>
            )}
            {!Utils.isNullOrEmpty(errorMsg) && !props.hideErrors && (
              <div
                css={`
                  color: #ff9090;
                  font-size: 13px;
                  margin: 10px;
                  ${props.useSameSpace ? `height: ${msgHHmax - 10 * 2}px; overflow-y: hidden;` : ''}
                `}
              >
                {errorMsg}
              </div>
            )}
            {!Utils.isNullOrEmpty(warningMsg) && !props.hideErrors && (
              <div
                css={`
                  color: #ceca5a;
                  font-size: 13px;
                  margin: 10px;
                  ${props.useSameSpace ? `height: ${msgHHmax - 10 * 2}px; overflow-y: hidden;` : ''}
                `}
              >
                {warningMsg}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      elem1 = (
        <div
          css={`
            display: block;
            padding: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
          `}
        >
          {expandFullElem}
          {elem1}
          {props.showSmallHelp && (
            <div
              css={`
                margin-top: 5px;
                color: rgba(255, 255, 255, 0.4);
                font-size: 13px;
                text-align: center;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 8px;
                padding-bottom: 8px;
              `}
            >
              <div
                css={`
                  color: rgba(255, 255, 255, 0.4);
                  margin-top: 5px;
                  font-size: 13px;
                  text-align: center;
                `}
              >
                {props.sample != null && <div>{props.sample}</div>}
                {!props.hideCtrlSpace && <div>(Press Ctrl+Space to autocomplete name of columns)</div>}
              </div>
            </div>
          )}
          {!Utils.isNullOrEmpty(errorMsg) && !props.hideErrors && (
            <div
              css={`
                color: #ff9090;
                font-size: 13px;
                margin: 10px;
                ${props.useSameSpace ? `height: ${msgHHmax - 10 * 2}px; overflow-y: hidden;` : ''}
              `}
            >
              {errorMsg}
            </div>
          )}
          {!Utils.isNullOrEmpty(warningMsg) && !props.hideErrors && (
            <div
              css={`
                color: #ceca5a;
                font-size: 13px;
                margin: 10px;
                ${props.useSameSpace ? `height: ${msgHHmax - 10 * 2}px; overflow-y: hidden;` : ''}
              `}
            >
              {warningMsg}
            </div>
          )}
          {isPreviewWork && (
            <div
              css={`
                color: #213a93;
                font-size: 13px;
                margin: 10px;
              `}
            >
              <div
                css={`
                  width: 200px;
                  font-size: 13px;
                  margin: 0 auto;
                `}
              >
                <div
                  css={`
                    margin-bottom: 4px;
                    text-align: center;
                  `}
                >
                  Preparing Preview...
                </div>
                <div>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </div>
            </div>
          )}
          {isValidating && (
            <div
              css={`
                color: #213a93;
                font-size: 13px;
                margin: 10px;
              `}
            >
              <div
                css={`
                  width: 200px;
                  font-size: 13px;
                  margin: 0 auto;
                `}
              >
                <div
                  css={`
                    margin-bottom: 4px;
                    text-align: center;
                  `}
                >
                  {processingLabel ?? 'Validating...'}
                </div>
                <div>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    let resE = props.onlyProgressAndErrors ? (
      elem1
    ) : (
      <div
        className={sd.monacoEditor}
        css={`
          ${props.backTrasnparent ? `border: 1px solid rgba(255,255,255,0.5); ` : ''} background-color: ${props.readSure || props.backTrasnparent ? 'transparent' : !props.askName ? '#1e1e1e' : 'unset'};
          min-height: ${HH + 2 + 2 * 4}px;
        `}
      >
        {elem1}
      </div>
    );

    if (props.seeMore) {
      resE = <SeeMore>{resE}</SeeMore>;
    }

    return resE;
  }),
);

export default EditorElem;
