import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import deployments from '../../stores/reducers/deployments';
import deploymentsCode from '../../stores/reducers/deploymentsCode';
import deploymentsTokens from '../../stores/reducers/deploymentsTokens';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./DeployLookupApi.module.css');
const sd = require('../antdUseDark.module.css');

const TOKEN_NO_TOKEN = 'DEPLOYMENT_AUTH_TOKEN';

let styleCodeRoot: CSSProperties = {
  borderRadius: '4px',
  padding: '10px 14px',
};

interface IDeployLookupApiProps {
  optionsTestDatasRes?: any;
}

const DeployLookupApi = React.memo((props: PropsWithChildren<IDeployLookupApiProps>) => {
  const { deploymentsTokensParam, deploymentsCodeParam, deploymentsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    deploymentsParam: state.deployments,
    deploymentsTokensParam: state.deploymentsTokens,
    deploymentsCodeParam: state.deploymentsCode,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [queryData, setQueryData] = useState('');
  const [queryDataIndex, setQueryDataIndex] = useState(0);
  const [queryDataCount, setQueryDataCount] = useState(0);
  const [selToken, setSelToken] = useState(null);
  const [predData, setPredData] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);

  const [selSampleCodeIndex, setSelSampleCodeIndex] = useState(0);
  const [selLang, setSelLang] = useState(null);

  const projectId = paramsProp?.get('projectId');
  const deployId = paramsProp?.get('deployId');

  const ids = useMemo(() => {
    return props.optionsTestDatasRes?.resultTestDatas?.ids;
  }, [props.optionsTestDatasRes]);

  useEffect(() => {
    if (ids != null && _.isArray(ids)) {
      setQueryDataCount(ids.length);
      setQueryDataIndex(0);
      setQueryData(JSON.stringify(ids?.[0]));
    } else {
      setQueryDataCount(0);
      setQueryDataIndex(0);
      setQueryData('');
    }
  }, [ids]);

  useEffect(() => {
    setQueryData(JSON.stringify(ids?.[queryDataIndex]));
  }, [ids, queryDataIndex]);

  const doPred = useCallback(() => {
    setQueryData((data1) => {
      setSelToken((token1) => {
        let token2 = token1;
        if (token2 === TOKEN_NO_TOKEN) {
          token2 = null;
        }

        setIsPredicting(true);
        REClient_.client_().lookupFeatures(token2, deployId, Utils.tryJsonParse(data1), (err, res) => {
          setIsPredicting(false);

          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            let r1 = res?.result;
            if (!_.isString(r1)) {
              r1 = JSON.stringify(r1, undefined, 2);
            }

            if (r1 != null && _.isString(r1)) {
              const max = 20000;
              if (r1.length > max) {
                r1 = r1.substring(0, max) + '...';
              }
            }

            setPredData(r1);
          }
        });

        return token1;
      });

      return data1;
    });
  }, [deployId]);

  useEffect(() => {
    deployments.memDeployForProject(true, undefined, projectId);
  }, [projectId, deploymentsParam]);
  const deployList = useMemo(() => {
    return deployments.memDeployForProject(false, undefined, projectId);
  }, [projectId, deploymentsParam]);

  const optionsDeploys = useMemo(() => {
    return deployList?.map((d1) => {
      return {
        label: d1.name || '-',
        value: d1.deploymentId,
      };
    });
  }, [deployList]);

  const onChangeSelectDeployment = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let deployId = optionSel?.value;
    if (projectId && deployId) {
      Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/' + deployId);
    }
  };

  let deploymentSelect = useMemo(() => {
    let popupContainerForMenu = (node) => document.getElementById('body2');

    const optionsDeploysSel = optionsDeploys?.find((d1) => d1?.value === deployId);

    return (
      <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );
  }, [optionsDeploys, deployId]);

  useEffect(() => {
    deploymentsTokens.memDeploymentTokensList(true, undefined, projectId);
  }, [deploymentsTokensParam, projectId]);
  const tokensList = useMemo(() => {
    return deploymentsTokens.memDeploymentTokensList(false, undefined, projectId);
  }, [deploymentsTokensParam, projectId]);

  const onClickCreateToken = () => {
    if (!projectId) {
      return;
    }

    REClient_.client_().createDeploymentToken(projectId, null, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');
        StoreActions.deployTokensList_(projectId);
      }
    });
  };

  let createTokenButton = useMemo(() => {
    if (tokensList && tokensList.length === 0) {
      return (
        <ModalConfirm onConfirm={onClickCreateToken} title={`Do you want to create a deployment token?`} icon={<QuestionCircleOutlined style={{ color: 'green' }} />} okText={'Create'} cancelText={'Cancel'} okType={'primary'}>
          <Button type={'primary'} style={{ marginLeft: '20px' }}>
            Create New Token
          </Button>
        </ModalConfirm>
      );
    }
    return null;
  }, [tokensList]);

  const onChangeSelToken = (option1) => {
    setSelToken(option1?.value);
  };

  const tokensRender = useMemo(() => {
    if (tokensList) {
      let options = tokensList.map((t1) => ({ label: t1.deploymentToken, value: t1.deploymentToken }));
      if (options.length === 0) {
        options.unshift({ label: TOKEN_NO_TOKEN, value: TOKEN_NO_TOKEN });
      }

      let selOption = selToken ? options.find((o1) => o1.value === selToken) : null;
      let popupContainerForMenu = (node) => document.getElementById('body2');

      if (selOption == null && options && options.length > 0) {
        setTimeout(() => {
          setSelToken(options[0].value);
        }, 0);
      }

      return (
        <span style={{ display: 'inline-block', marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', marginRight: '5px' }}>Token:</span>
          <span style={{ display: 'inline-block', width: '400px' }}>
            <SelectExt value={selOption} options={options} onChange={onChangeSelToken} menuPortalTarget={popupContainerForMenu(null)} />
          </span>
        </span>
      );
    }
  }, [tokensList, selToken]);

  const predictionsRender = useMemo(() => {
    let styleCodeRoot2: CSSProperties = {
      borderRadius: '4px',
      padding: '10px 14px',
    };

    return (
      <div
        style={{ color: Utils.colorAall(1) }}
        css={`
          .comment.linenumber.react-syntax-highlighter-line-number {
            display: none !important;
          }
        `}
      >
        <div style={{ marginTop: '10px', marginBottom: '14px', fontSize: '16px' }}>
          Response:
          <HelpIcon id={'lookupapi_response'} style={{ marginLeft: '4px' }} />
        </div>
        <div id={'outputResult'} className={' ' + sd.codeSyntax}>
          <SyntaxHighlighter wrapLongLines={true} language={'json'} style={dark} showLineNumbers={false} customStyle={styleCodeRoot2} wrapLines={true}>
            {predData}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }, [predData]);

  const optionsQuerySamples = useMemo(() => {
    return ids?.map((id1, ind) => ({ label: 'Data ' + (ind + 1), value: ind })) ?? [];
  }, [queryDataCount, ids]);
  const optionsQuerySamplesSel = optionsQuerySamples?.[queryDataIndex];

  const onChangeSampleIndex = (option1) => {
    setQueryDataIndex(option1?.value ?? 0);
  };

  useEffect(() => {
    deploymentsCode.memSampleForDeployId(true, deployId);
  }, [deployId, deploymentsCodeParam]);
  const sampleCode = useMemo(() => {
    return deploymentsCode.memSampleForDeployId(false, deployId);
  }, [deployId, deploymentsCodeParam]);

  const optionsSampleCodeList = useMemo(() => {
    if (sampleCode && sampleCode?.length > 0) {
      let res = [];
      sampleCode?.some((s1, s1ind) => {
        let kk = Object.keys(s1?.clients ?? {});
        kk.some((k1) => {
          res.push({
            label: (
              <span>
                {sampleCode?.length === 1 ? null : (
                  <span>
                    <span
                      css={`
                        opacity: 0.8;
                      `}
                    >
                      Sample{' '}
                    </span>
                    <span>{s1ind + 1}: </span>
                  </span>
                )}
                <span>{k1}</span>
              </span>
            ),
            value: '' + s1ind + '_' + k1,
            data: { index: s1ind, lang: k1, code: s1?.clients?.[k1] },
          });
        });
      });

      if (res && res.length > 0) {
        setSelLang((s1) => {
          setSelSampleCodeIndex((index) => {
            if (index == null || index >= (res?.length ?? 0)) {
              index = 0;
            }

            if (s1 == null || !res?.find((d1) => d1.data?.index === index && d1.data?.lang === s1)) {
              setTimeout(() => {
                setSelLang(res?.[0]?.data?.lang);
                setSelSampleCodeIndex(0);
              }, 0);
            }

            return index;
          });

          return s1;
        });
      }

      if (res?.length === 0) {
        res = null;
      }
      return res;
    }
  }, [sampleCode, selLang]);

  const optionsSampleCodeListSel = optionsSampleCodeList?.find((l1) => l1.value === '' + selSampleCodeIndex + '_' + selLang);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const onChangeSelLang = (option1) => {
    setSelSampleCodeIndex(option1?.data?.index);
    setSelLang(option1?.data?.lang);
  };

  const lang1 = useMemo(() => {
    let lang1 = 'python';
    if (selLang === 'python') {
      lang1 = 'python';
    } else if (selLang === 'curl') {
      lang1 = 'bash';
    }
    return lang1;
  }, [selLang]);

  const code1 = useMemo(() => {
    if (optionsSampleCodeListSel?.data?.code?.input) {
      let res = optionsSampleCodeListSel?.data?.code?.input;
      if (res) {
        if (!Utils.isNullOrEmpty(selToken)) {
          res = res.replace('DEPLOYMENT_AUTH_TOKEN', () => selToken);
        }
        if (!Utils.isNullOrEmpty(queryData)) {
          let dataDict = JSON.stringify(Utils.tryJsonParse(queryData) ?? '');
          if (dataDict && selLang === 'python') {
            dataDict = dataDict
              .replace(/:null/g, ':None')
              .replace(/:true/g, ':True')
              .replace(/:false/g, ':False');
          }
          res = res.replace('EXAMPLE_DATA', () => dataDict);
        }
        // res = res.replace('PREDICTION', () => (selResult ?? ''));
      }
      return res;
    } else {
      return '';
    }
  }, [selToken, selLang, selSampleCodeIndex, optionsSampleCodeListSel, queryData]);

  return (
    <div
      css={`
        margin: 30px;
      `}
      className={sd.absolute}
    >
      <NanoScroller onlyVertical>
        <div style={{ position: 'relative' }}>
          <div className={sd.titleTopHeaderAfter} style={{ position: 'relative', height: topAfterHeaderHH }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>Look-Up API</span>
              {deploymentSelect}
            </div>

            {/*<div style={{ position: 'absolute', right: 0, top: 0, }}>*/}
            {/*  <HelpBox name={'Look-Up API'} linkTo={'/help/useCases/'+useCaseOne+'/predictions'} />*/}
            {/*</div>*/}
          </div>

          <div>
            {tokensRender}
            {createTokenButton}
          </div>
          {
            <div>
              <div
                style={{ marginTop: '20px', fontSize: '16px', marginBottom: '12px' }}
                css={`
                  display: flex;
                  align-items: center;
                `}
              >
                <span>
                  Input Data:
                  <HelpIcon id={'lookupapi_input'} style={{ marginLeft: '4px' }} />
                </span>
                {queryDataCount != null && queryDataCount > 1 && (
                  <span
                    css={`
                      margin-left: 10px;
                      font-size: 13px;
                      width: 200px;
                      display: inline-block;
                    `}
                  >
                    <SelectExt options={optionsQuerySamples} value={optionsQuerySamplesSel} onChange={onChangeSampleIndex} />
                  </span>
                )}

                {optionsSampleCodeList != null && optionsSampleCodeList?.length > 0 && (
                  <span
                    css={`
                      margin: 0 5px 0 20px;
                    `}
                  >
                    Code:
                  </span>
                )}
                {optionsSampleCodeList != null && optionsSampleCodeList?.length > 0 && (
                  <span
                    css={`
                      font-size: 14px;
                    `}
                    style={{ display: 'inline-block', width: '300px' }}
                  >
                    <SelectExt value={optionsSampleCodeListSel} options={optionsSampleCodeList} onChange={onChangeSelLang} menuPortalTarget={popupContainerForMenu(null)} />
                  </span>
                )}
              </div>
              <Input.TextArea
                style={{ height: optionsSampleCodeList != null ? '130px' : '180px' }}
                value={queryData}
                onChange={(e) => {
                  setQueryData(e.target.value);
                }}
              />

              {optionsSampleCodeListSel != null && (
                <div
                  className={' ' + sd.codeSyntax + ' ' + sd.codeSyntax}
                  css={`
                    margin-top: 15px;
                  `}
                >
                  <div
                    css={`
                      margin-bottom: 8px;
                      font-size: 16px;
                      font-family: Matter;
                    `}
                  >
                    Sample Code:
                    <HelpIcon id={'lookupapi_samplecode'} style={{ marginLeft: '4px' }} />
                  </div>
                  <SyntaxHighlighter
                    key={'input' + selLang + '-' + selSampleCodeIndex}
                    language={lang1}
                    style={dark}
                    showLineNumbers={false}
                    customStyle={styleCodeRoot}
                    wrapLines={true}
                    lineProps={{ style: { position: 'relative', display: 'block', whiteSpace: 'normal' } }}
                  >
                    {code1}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          }

          <div
            css={`
              margin: 20px 0;
            `}
          >
            <Button type={'primary'} onClick={doPred}>
              Look Up Features
            </Button>
          </div>

          <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={isPredicting ? 'Looking Up Features...' : null} isDim={isPredicting ? true : null} isRelative msgTop={0}>
            {predictionsRender}
          </RefreshAndProgress>
        </div>
      </NanoScroller>
    </div>
  );
});

export default DeployLookupApi;
