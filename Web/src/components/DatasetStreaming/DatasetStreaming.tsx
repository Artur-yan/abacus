import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as Immutable from 'immutable';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import datasetsReq from '../../stores/reducers/datasets';
import streamTokens from '../../stores/reducers/streamTokens';
import CopyText from '../CopyText/CopyText';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./DatasetStreaming.module.css');
const sd = require('../antdUseDark.module.css');
// import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
// import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
// import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import { useFeatureGroup } from '../../api/REUses';
import StoreActions from '../../stores/actions/StoreActions';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import EditorElem from '../EditorElem/EditorElem';
import HelpBox from '../HelpBox/HelpBox';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import StreamingTest from '../StreamingTest/StreamingTest';
import StreamingTestRecords from '../StreamingTestRecords/StreamingTestRecords';
// SyntaxHighlighter.registerLanguage('javascript', js);
// SyntaxHighlighter.registerLanguage('python', python);
// SyntaxHighlighter.registerLanguage('bash', bash);

interface IDatasetStreamingProps {
  isFinish?: boolean;
}

const streamTokensViewAll = { label: 'Click here to list all tokens', value: null };

const DatasetStreaming = React.memo((props: PropsWithChildren<IDatasetStreamingProps>) => {
  const { useCases, defDatasets, projects, authUserParam, paramsProp, datasetsParam, streamTokensParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    datasetsParam: state.datasets,
    streamTokensParam: state.streamTokens,
    authUserParam: state.authUser,
    projects: state.projects,
    defDatasets: state.defDatasets,
    useCases: state.useCases,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');
  const datasetId = paramsProp?.get('datasetId');
  let fromFG = paramsProp?.get('fromFG');
  if (fromFG === '') {
    fromFG = null;
  }

  const [consoleJson, setConsoleJson] = useState('');

  const [streamingIdsForProject, setStreamingIdsForProject] = useState({});
  useEffect(() => {
    if (Utils.isNullOrEmpty(projectId)) {
      return;
    }

    REClient_.client_()._getStreamingIds(projectId, (err, res) => {
      if (err || !res?.success || !res?.result) {
        //
      } else {
        setStreamingIdsForProject(res?.result);
      }
    });
  }, [projectId]);

  useEffect(() => {
    datasetsReq.memDatasetListCall(true, datasetsParam, [datasetId]);
  }, [datasetId, datasetsParam]);

  const datasetFound: Immutable.Map<string, any> = useMemo(() => {
    let res = datasetsReq.memDatasetListCall(false, datasetsParam, [datasetId]);
    if (res != null) {
      res = Object.values(res)[0];
    }
    return res as Immutable.Map<string, any>;
  }, [datasetId, datasetsParam]);

  const datasetFeatureGroupId = datasetFound?.get('featureGroupId');

  const datasetFeatureGroupOne = useFeatureGroup(null, datasetFeatureGroupId);

  useEffect(() => {
    streamTokens.memTokensList(true);
  }, [streamTokensParam]);
  const streamTokesList = useMemo(() => {
    return streamTokens.memTokensList(false);
  }, [streamTokensParam]);

  const [streamToken, setStreamToken] = useState(null);
  const onChangeSelectStreamToken = (option1) => {
    setStreamToken(option1?.value);
  };

  const streamTokensOptions = useMemo(() => {
    let res = (streamTokesList ?? []).map((s1) => ({ label: s1.streamingToken, value: s1.streamingToken }));
    res &&
      res.sort((a, b) => {
        return (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase());
      });
    return res;
  }, [streamTokesList]);
  const streamTokensOptionsSel = streamTokensOptions?.find((s1) => s1.value === streamToken) || streamTokensViewAll;

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const refAlreadyCreated = useRef(false);
  useMemo(() => {
    let list = streamTokens.calcTokens();
    if (list != null) {
      if (list.length === 0) {
        if (!refAlreadyCreated.current) {
          refAlreadyCreated.current = true;

          REClient_.client_().createStreamingToken((err, res) => {
            if (err) {
              Utils.error(err);
            } else {
              let streamingToken = res?.result?.streamingToken;
              if (streamingToken) {
                setStreamToken(streamingToken);
              }
            }
          });
        }
      } else {
        if (Utils.isNullOrEmpty(streamToken)) {
          let t1 = streamTokensOptions?.[0]?.value;
          if (!Utils.isNullOrEmpty(t1)) {
            setStreamToken(t1);
          }
        }
      }
    }
  }, [streamTokensParam, streamTokensOptions]);

  const [lang1, setLang1] = useState('xml');
  const styleCodeRoot2: CSSProperties = {
    borderRadius: '4px',
    padding: '10px 14px',
  };

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projects, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projects, projectId]);

  const memProjectUseCase = (foundProject1) => {
    if (!foundProject1) {
      return;
    }
    return foundProject1.useCase;
  };

  const useCase1 = useMemo(() => {
    return memProjectUseCase(foundProject1);
  }, [foundProject1]);

  useEffect(() => {
    memUseCasesSchemasInfo(true, useCase1);
  }, [useCases, useCase1]);
  const useCaseInfo = useMemo(() => {
    return memUseCasesSchemasInfo(false, useCase1);
  }, [useCases, useCase1]);

  const [codeSample, setCodeSample] = useState(null);

  useEffect(() => {
    if (Utils.isNullOrEmpty(streamToken)) {
      return;
    }

    const fgid: any = datasetFound?.getIn(['featureGroupId']);
    if (fgid) {
      REClient_.client_()._getSampleStreamingCode(fgid, projectId, (err, res) => {
        if (err || !res?.success) {
          setCodeSample(null);
        } else {
          setCodeSample(res?.result);
        }
      });
    } else {
      setCodeSample(null);
    }
  }, [datasetFound, streamToken]);

  const langOptions = useMemo(() => {
    let res = null;
    if (codeSample != null) {
      res = [];
      let kk = Object.keys(codeSample);
      kk.some((k1) => {
        k1 = k1?.toLowerCase();
        switch (k1) {
          case 'python':
            res.push({ label: 'Python', value: 'python' });
            break;
          case 'curl':
            res.push({ label: 'Curl', value: 'curl', lang: 'bash' });
            break;
          case 'javascript':
            res.push({ label: 'Javascript', value: 'javascript' });
            break;
        }
      });

      if (kk?.includes('console') && !Utils.isNullOrEmpty(codeSample?.['console']) && _.isString(codeSample?.['console']?.url)) {
        res.unshift({ label: 'Console', value: 'console', url: codeSample?.['console']?.url, example: codeSample?.['console']?.exampleData });
      }
    }

    return res;
  }, [codeSample]);

  useEffect(() => {
    if (langOptions == null) {
      return;
    }

    setLang1((l1) => {
      if (langOptions?.find((s1) => s1.value === l1) == null) {
        l1 = (langOptions?.[0]?.value === 'console' ? langOptions?.[1]?.value : null) ?? langOptions?.[0]?.value;

        setConsoleJson((l2) => {
          let lTemp = langOptions?.[0]?.value === 'console' ? langOptions?.[0]?.example : null;
          if (!l2 && lTemp) {
            l2 = lTemp;
          }

          return l2;
        });
      }
      return l1;
    });
  }, [langOptions]);

  const langOptionsSel = langOptions?.find((l1) => l1.value === lang1);

  const onChangeSelectLang = (option1) => {
    setLang1(option1?.value || langOptions?.[0]?.value);
  };

  const onChangeConsoleJson = (name, value) => {
    setConsoleJson(value);
  };

  const onClickStreamDataNow = (e) => {
    let json1 = Utils.tryJsonParse(consoleJson);
    if (json1 == null) {
      REActions.addNotificationError('Invalid JSON');
      return;
    }

    let url1 = langOptions?.find((o1) => o1.value === 'console')?.url;

    if (!Utils.isNullOrEmpty(url1)) {
      REClient_.client_().postJson(url1, JSON.stringify({ data: json1 }), null, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || 'Error streaming data');
        } else {
          REActions.addNotification('Done!');
        }
      });
    }
  };

  const streamDataReady = useMemo(() => {
    return datasetFeatureGroupOne?.streamingReady === true;
  }, [datasetFeatureGroupOne]);

  const streamDataEnabledTimer = useRef(null);
  useEffect(() => {
    if (streamDataEnabledTimer.current != null) {
      clearInterval(streamDataEnabledTimer.current);
      streamDataEnabledTimer.current = null;
    }

    if (Utils.isNullOrEmpty(datasetFeatureGroupId)) {
      return;
    }

    if (!streamDataReady) {
      streamDataEnabledTimer.current = setInterval(() => {
        StoreActions.featureGroupsDescribe_(null, datasetFeatureGroupId);
      }, 10 * 1000);
    }

    return () => {
      if (streamDataEnabledTimer.current != null) {
        clearInterval(streamDataEnabledTimer.current);
        streamDataEnabledTimer.current = null;
      }
    };
  }, [streamDataReady, datasetFeatureGroupId]);

  const isConsoleAllow = useMemo(() => {
    return langOptions?.find((o1) => o1.value === 'console');
  }, [langOptions]);

  const onClickChangeToConsole = (e) => {
    setLang1('console');
  };

  const finishLink = useMemo(() => {
    if (Utils.isNullOrEmpty(fromFG)) {
      return '/' + PartsLink.dataset_detail + '/' + datasetId + (projectId ? '/' + projectId : '');
    } else {
      return '/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + fromFG;
    }
  }, [fromFG, datasetId, projectId]);

  return (
    <div className={sd.absolute}>
      <NanoScroller>
        <div style={{ padding: '30px 40px 70px' }}>
          <div style={{ width: '900px', margin: '0 auto' }}>
            <div style={{ padding: '20px' }} className={sd.grayPanel}>
              <div style={{ margin: '14px 0', textAlign: 'center', fontSize: '16px' }}>
                <FontAwesomeIcon icon={['fad', 'signal-stream']} transform={{ size: 30, x: 0, y: 0 }} style={{ marginRight: '18px' }} />
                Streaming
              </div>
              <div style={{ fontSize: '16px' }}>
                <div style={{ margin: '7px 0' }}>
                  <span style={{ color: Utils.colorA(0.8) }}>Feature Group Name: </span>
                  <span>{datasetFound?.getIn(['featureGroupTableName']) as any}</span>
                </div>
              </div>
            </div>

            {
              <div style={{ textAlign: 'center', fontSize: '16px', marginTop: '20px', padding: '10px 20px 10px 20px' }} className={sd.grayPanel}>
                <HelpBox isBig={true} name={'Need more help streaming data?'} subtitle={'Refer to'} subtitle2={'Streaming'} linkTo={'/help/useCases/DATA_INGESTION_STREAMING'} />
              </div>
            }

            {codeSample != null && (
              <div
                css={`
                  display: flex;
                  align-items: center;
                `}
                style={{ fontSize: '16px', marginTop: '20px', padding: '10px 20px 10px 20px' }}
                className={sd.grayPanel}
              >
                <span style={{ color: Utils.colorA(0.8) }}>API Library: </span>
                <span style={{ display: 'inline-block', width: '300px', marginLeft: '5px' }}>
                  <SelectExt value={langOptionsSel} options={langOptions} onChange={onChangeSelectLang} menuPortalTarget={popupContainerForMenu(null)} />
                </span>
                <span
                  css={`
                    flex: 1;
                  `}
                ></span>
                {isConsoleAllow && lang1 !== 'console' && (
                  <span>
                    <Button onClick={onClickChangeToConsole} size={'small'} type={'primary'}>
                      Test with some example data
                    </Button>
                  </span>
                )}
              </div>
            )}

            {lang1 === 'console' && (
              <div
                css={`
                  padding: 20px;
                  margin-top: 20px;
                `}
                className={sd.grayPanel}
              >
                <div style={{ marginBottom: '10px', fontSize: '14px' }}>Write a JSON Object to stream:</div>
                <EditorElem lang={'json'} hideExpandFull value={consoleJson} onChange={onChangeConsoleJson} />
                <div
                  css={`
                    margin-top: 10px;
                    text-align: center;
                  `}
                >
                  <Button disabled={!streamDataReady} onClick={onClickStreamDataNow} type={'primary'} size={'small'}>
                    Stream Data
                  </Button>
                  {!streamDataReady && (
                    <div
                      css={`
                        margin-top: 10px;
                        opacity: 0.8;
                        font-size: 14px;
                      `}
                    >
                      Enabling streaming endpoint….
                    </div>
                  )}
                </div>
              </div>
            )}

            {codeSample != null && lang1 !== 'console' && codeSample?.[lang1] != null && (
              <div style={{ marginTop: '20px', padding: '20px 20px 10px 20px' }} className={sd.grayPanel + ' ' + sd.codeSyntax}>
                <div style={{ marginBottom: '10px', fontSize: '14px' }}>Sample Code:</div>
                <SyntaxHighlighter language={langOptionsSel?.lang || lang1} style={dark} showLineNumbers={false} customStyle={styleCodeRoot2} wrapLines={true} wrapLongLines={true}>
                  {codeSample?.[lang1]}
                </SyntaxHighlighter>
                <div
                  css={`
                    display: flex;
                    align-items: center;
                  `}
                >
                  <CopyText noText text={<span style={{ color: Utils.colorA(0.7) }}>Copy to Clipboard</span>}>
                    {codeSample?.[lang1]}
                  </CopyText>
                  <span
                    css={`
                      flex: 1;
                    `}
                  ></span>
                </div>
              </div>
            )}

            {
              <div style={{ margin: '20px', textAlign: 'center' }}>
                <StreamingTest datasetId={datasetId} />
              </div>
            }
          </div>

          {
            <div style={{ margin: '20px', textAlign: 'center' }}>
              <StreamingTestRecords datasetId={datasetId} projectId={projectId} />
            </div>
          }
          <div style={{ margin: '20px', textAlign: 'center' }}>
            <Link to={finishLink}>
              <Button type={'primary'}>Finish</Button>
            </Link>
          </div>
        </div>
      </NanoScroller>
    </div>
  );
});

export default DatasetStreaming;
