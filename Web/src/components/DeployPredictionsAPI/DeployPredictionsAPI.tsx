import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../../stores/reducers/deployments';
import deploymentsCode from '../../stores/reducers/deploymentsCode';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./DeployPredictionsAPI.module.css');
const sd = require('../antdUseDark.module.css');
// import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
// import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
// import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { calcDeploymentsTokensByProjectId } from '../../stores/reducers/deploymentsTokens';
import projects, { memProjectById } from '../../stores/reducers/projects';
import requests from '../../stores/reducers/requests';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';

// SyntaxHighlighter.registerLanguage('javascript', js);
// SyntaxHighlighter.registerLanguage('python', python);
// SyntaxHighlighter.registerLanguage('bash', bash);

const TOKEN_NO_TOKEN = 'DEPLOYMENT_AUTH_TOKEN';

interface IDeployPredictionsAPIProps {
  paramsProp?: any;
  deployments?: any;
  requests?: any;
  deploymentsCode?: any;
  deploymentsTokens?: any;
  projects?: any;
  useCases?: any;
  optionsTestDatasRes?: any;
}

interface IDeployPredictionsAPIState {
  isProcessing?: boolean;
  selLang?: string;
  selToken?: string;
  selExampleData?: string;
  selExampleDataOriginal?: string;
  selResult?: string;
  isResultReplied?: boolean;
  predictionApiList?: string[];
  predictionApi?: string;
  predictionApiOptions?: string[];
  explainPredictions?: boolean;
  isReadyForRun?: boolean;
}

class DeployPredictionsAPI extends React.PureComponent<IDeployPredictionsAPIProps, IDeployPredictionsAPIState> {
  private isM: boolean;

  constructor(props) {
    super(props);

    this.state = {
      isProcessing: false,
      selExampleData: null,
      selExampleDataOriginal: null,
      isResultReplied: false,
    };
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  doMemFromPredDash = memoizeOne((fromPredDash, deployId, predictionApi) => {
    if (fromPredDash) {
      if (REClient_.dataForPredAPI != null) {
        let exampleData = REClient_.dataForPredAPI;
        REClient_.dataForPredAPI = null;

        this.setState({
          selExampleData: JSON.stringify(exampleData),
          selExampleDataOriginal: !Utils.isNullOrEmpty(exampleData) ? JSON.stringify(exampleData) : null,
        });
      }
    }
  });

  calcRequestId = () => {
    let requestId = this.props.paramsProp?.get('requestId');
    if (requestId === '') {
      requestId = null;
    }
    return requestId;
  };

  calcRequestBPId = () => {
    return Utils.tryParseInt(this.props.paramsProp?.get('requestBPId')?.split('_')?.[0]);
  };

  calcRequestBPIdVersion = () => {
    return this.props.paramsProp?.get('requestBPId')?.split('_')?.[1];
  };

  componentWillUnmount() {
    this.isM = false;
  }

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  memExplainableProject = memoizeOneCurry((doCall, deployId) => {
    return projects.memExplainableProject(doCall, null, deployId);
  });

  memRequestOne = memoizeOneCurry((doCall, requestsParam, deployId, requestId) => {
    return requests.memRequestById(doCall, undefined, deployId, requestId);
  });

  memSampleReady = memoizeOne((data) => {
    let isReady = true;
    if (data == null || Utils.tryJsonParse(data) == null || _.isEmpty(Utils.tryJsonParse(data))) {
      isReady = false;
    }

    if (this.state.isReadyForRun !== isReady) {
      this.setState({
        isReadyForRun: isReady,
      });
    }
  });

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    this.memSampleReady(this.state.selExampleData);
    let projectId = this.props.paramsProp?.get('projectId');
    let deployId = this.props.paramsProp?.get('deployId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    const isPnpPython = foundProject1?.isPnpPython === true;
    const isSentimentAnalysis = foundProject1?.useCase === 'NLP_SENTIMENT';
    const isLangDetection = foundProject1?.useCase === 'LANGUAGE_DETECTION';

    let useCaseOne = this.memProjectUseCase(foundProject1);

    let selUseCase = this.memUseCaseSel(true)(this.props.useCases, useCaseOne);
    let sampleCode = this.memSampleCode(true)(this.props.deploymentsCode, deployId);
    let listDeployments = this.memDeploymentList(true)(this.props.deployments, deployId, projectId);
    let tokensList = this.memDeploymentTokensList(true)(this.props.deploymentsTokens, projectId);

    let useDataId = this.props.paramsProp?.get('useDataId');
    if (useDataId) {
      this.memTestDatasSelect(useDataId, this.props.optionsTestDatasRes, deployId);
    }
    this.memPnpPython(isPnpPython, isLangDetection);

    const isExplainable = this.memExplainableProject(true)(deployId);

    if (this.calcRequestId() != null) {
      let reqOne = this.memRequestOne(true)(this.props.requests, deployId, this.calcRequestId())?.[0];
      this.memBPDataSelect(reqOne?.response);
    }

    if (this.calcRequestBPId() != null) {
      let bpData = this.memBPData(true)(this.props.requests, this.calcRequestBPId(), this.calcRequestBPIdVersion());
      this.memBPDataSelect(bpData);
    }

    this.doMemFromPredDash(this.props.paramsProp?.get('fromPredDash'), this.props.paramsProp?.get('deployId'), this.state.predictionApi);
  };

  memBPDataSelect = memoizeOne((bpData) => {
    if (bpData != null) {
      let data1 = bpData?.input;
      let res1 = bpData?.prediction ?? bpData?.predicted;

      this.setState({
        selExampleData: JSON.stringify(data1),
        selExampleDataOriginal: !Utils.isNullOrEmpty(data1) ? JSON.stringify(data1) : null,
        selResult: JSON.stringify(res1 ?? {}, null, 2),
      });
    }
  });

  memBPData = memoizeOneCurry((doCall, requestsParam, requestBPId, batchPredictionVersion) => {
    return requests.memRequestBPById(doCall, undefined, batchPredictionVersion, requestBPId ?? 0);
  });

  memPnpPython = memoizeOne((isPnpPython, isLangDetection) => {
    if (isPnpPython === true) {
      this.setState({
        selExampleData: '',
        selExampleDataOriginal: '',
      });
    }
  });

  memTestDatasSelect = memoizeOne((useDataId, optionsTestDatasRes, deployId) => {
    if (optionsTestDatasRes && useDataId) {
      let data1 = (Object.values(optionsTestDatasRes?.rangeDateByTestDataId)?.find((v1: any) => '' + v1?.id === '' + useDataId) as any)?.data;
      if (data1) {
        if (this.props.paramsProp?.get('useDataTokens') === 'true') {
          const procRow = (row) => {
            if (optionsTestDatasRes?.displayType?.toLowerCase() === 'languagedetection'.toLowerCase()) {
              return row?.documents ?? '';
            } else if (optionsTestDatasRes?.displayType?.toLowerCase() === 'search') {
              return row?.query ?? '';
            } else {
              return row?.tokens?.map((t1) => t1?.content ?? '')?.join(row?.addTokenSpaces === false ? '' : ' ') ?? '';
            }
          };

          data1 = procRow(data1) ?? '';
          this.setState({
            selExampleData: data1,
            selExampleDataOriginal: !Utils.isNullOrEmpty(data1) ? data1 : null,
          });
          return;
        }

        this.setState({
          selExampleData: JSON.stringify(data1),
          selExampleDataOriginal: !Utils.isNullOrEmpty(data1) ? JSON.stringify(data1) : null,
        });
      }
    }
  });

  componentDidUpdate(prevProps: Readonly<IDeployPredictionsAPIProps>, prevState: Readonly<IDeployPredictionsAPIState>, snapshot?: any): void {
    this.doMem();
  }

  memDeploymentList = memoizeOneCurry((doCall, deployments, deployId, projectId) => {
    if (deployments && projectId) {
      if (deployments.get('isRefreshing') !== 0) {
        return;
      }

      let res = calcDeploymentsByProjectId(undefined, projectId);
      if (res == null) {
        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        if (res && res.length > 0) {
          let res2 = [];
          res.some((r1) => {
            if ([DeploymentLifecycle.ACTIVE].includes(r1.status)) {
              res2.push(r1);
            }
          });
          res = res2;
        }

        if (Utils.isNullOrEmpty(deployId) || (deployId && res?.find((r1) => r1.deploymentId === deployId) == null)) {
          if (res && res.length > 0) {
            deployId = res[0].deploymentId;
            if (!Utils.isNullOrEmpty(deployId)) {
              setTimeout(() => {
                Location.push('/' + PartsLink.deploy_predictions_api + '/' + projectId + '/' + deployId);
              }, 0);
            }
          }
        }

        return res;
      }
    }
  });

  onChangeExplainPred = (e) => {
    let v1 = e.target.checked;
    this.setState({
      explainPredictions: v1,
    });
  };

  memPredictionsRender = memoizeOne(
    (
      isReadyForRun,
      showSampleEditor,
      isPnpPython,
      isSentimentAnalysis,
      isLangDetection,
      deployId,
      projectId,
      sampleCode,
      langName,
      selToken,
      dataSend,
      selResult,
      isProcessing,
      isResultReplied,
      methodApi,
      isExplainable,
      explainPredictions,
    ) => {
      if (deployId && ((sampleCode && langName) || isLangDetection || isPnpPython)) {
        let calcCode = (inoutS) => {
          if (sampleCode && sampleCode.clients[langName] && sampleCode.clients[langName][inoutS]) {
            let res = sampleCode.clients[langName][inoutS];
            if (res) {
              if (!Utils.isNullOrEmpty(selToken)) {
                res = res.replace('DEPLOYMENT_AUTH_TOKEN', () => selToken);
              }
              if (!Utils.isNullOrEmpty(dataSend)) {
                let dataDict = JSON.stringify(Utils.tryJsonParse(dataSend) ?? '');
                if (dataDict && langName === 'python') {
                  dataDict = dataDict
                    .replace(/:null/g, ':None')
                    .replace(/:true/g, ':True')
                    .replace(/:false/g, ':False');
                }
                res = res.replace('EXAMPLE_DATA', () => dataDict);
              }
              res = res.replace('PREDICTION', () => selResult ?? '');
            }
            return res;
          } else {
            return '';
          }
        };

        let lang1 = 'python';
        if (langName === 'python') {
          lang1 = 'python';
        } else if (langName === 'curl') {
          lang1 = 'bash';
        }

        let styleCodeRoot: CSSProperties = {
          borderRadius: '4px',
          padding: '10px 14px',
        };
        let styleCodeRoot2: CSSProperties = {
          borderRadius: '4px',
          padding: '10px 14px',
        };

        let propsTextArea: any = {
          'data-result': isResultReplied,
        };

        let output = '';
        if (isLangDetection) {
          output = selResult || '';
        } else {
          output = calcCode('output');
        }

        if (output?.length > 2050) {
          output = output.substring(0, 2000) + '\n... <truncated ' + (output.length - 2000) + ' characters>';
        }

        let isDis1 = !this.state.isReadyForRun && showSampleEditor;
        let run1 = (
          <Button disabled={isDis1} type={'primary'} onClick={this.onClickRunExample} style={{ height: '26px', lineHeight: 1 }}>
            Run
          </Button>
        );
        if (isDis1) {
          run1 = (
            <span>
              {run1}
              <span
                css={`
                  margin-left: 10px;
                  color: red;
                  font-size: 13px;
                `}
              >
                Invalid Input Data
              </span>
            </span>
          );
        }

        return (
          <div
            style={{ color: Utils.colorAall(1) }}
            css={`
              .comment.linenumber.react-syntax-highlighter-line-number {
                display: none !important;
              }
            `}
          >
            {!isLangDetection && (
              <div style={{ marginTop: '20px', fontSize: '16px', marginBottom: '5px' }}>
                Request:
                <HelpIcon id={'predapi_request'} style={{ marginLeft: '4px' }} />
              </div>
            )}
            {!isLangDetection && (
              <div className={' ' + sd.codeSyntax + ' ' + sd.codeSyntax}>
                <SyntaxHighlighter
                  key={'input' + methodApi}
                  language={lang1}
                  style={dark}
                  showLineNumbers={false}
                  customStyle={styleCodeRoot}
                  wrapLines={true}
                  lineProps={{ style: { position: 'relative', display: 'block', whiteSpace: 'normal' } }}
                >
                  {calcCode('input')}
                </SyntaxHighlighter>
              </div>
            )}

            <div style={{ marginTop: '20px', marginBottom: '20px', fontSize: '16px' }}>
              {run1}
              {isExplainable && (
                <span
                  css={`
                    margin-left: 20px;
                  `}
                >
                  <Checkbox checked={this.state.explainPredictions ?? false} onChange={this.onChangeExplainPred}>
                    <span
                      css={`
                        color: white;
                        opacity: 0.8;
                      `}
                    >
                      Explain Predictions
                    </span>
                  </Checkbox>
                </span>
              )}
              {isProcessing && <span style={{ marginLeft: '10px', fontSize: '13px', opacity: 0.7 }}>(Processing...)</span>}
            </div>

            <div style={{ marginTop: '10px', marginBottom: '5px', fontSize: '16px' }}>
              Response:
              <HelpIcon id={'predapi_response'} style={{ marginLeft: '4px' }} />
            </div>
            <div id={'outputResult'} {...propsTextArea} className={' ' + sd.codeSyntax}>
              <SyntaxHighlighter key={'output' + methodApi} language={lang1} style={dark} showLineNumbers={false} customStyle={styleCodeRoot2} wrapLines={true}>
                {output}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }
    },
  );

  onClickRunExample = (e) => {
    this.doRunPrediction(true);
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memProjectUseCase = memoizeOne((foundProject1) => {
    if (!foundProject1) {
      return;
    }

    return foundProject1.useCase;
  });

  doRunPrediction = (showErrorIfNoToken = false) => {
    let { paramsProp, deployments } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let deployId = paramsProp && paramsProp.get('deployId');
    let selToken = this.state.selToken;

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    const isPnpPython = foundProject1?.isPnpPython === true;
    const isSentimentAnalysis = foundProject1?.useCase === 'NLP_SENTIMENT';
    const isNlpClassification = foundProject1?.useCase === 'NLP_CLASSIFICATION';
    const isLangDetection = foundProject1?.useCase === 'LANGUAGE_DETECTION';
    const isChatLLM = foundProject1?.useCase === 'CHAT_LLM';

    if (selToken == null || selToken === '' || selToken === TOKEN_NO_TOKEN) {
      if (showErrorIfNoToken) {
        REActions.addNotificationError('Please create a Deployment Token first');
      }
      return;
    }

    let data = this.state.selExampleData;

    if (!deployId || !selToken) {
      return;
    }

    this.setState({
      isProcessing: true,
      selResult: null,
      isResultReplied: false,
    });

    let dataField = null;
    if (isSentimentAnalysis || isNlpClassification) {
      dataField = 'document';
    }
    if (isChatLLM) {
      dataField = 'messages';
    }

    REClient_.client_().predictForUseCase(this.state.predictionApi, this.state.explainPredictions, dataField, selToken, deployId, data, (err, res) => {
      this.setState({
        isProcessing: false,
        isResultReplied: true,
      });

      if (err || !res || res.result === undefined) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        this.setState({
          selResult: JSON.stringify(res.result, null, 2),
        });
      }
    });
  };

  memSampleCode = memoizeOneCurry((doCall, deploymentsCodeParam, deployId) => {
    return deploymentsCode.memSampleForDeployId(doCall, deployId);
  });

  memLangList = memoizeOne((sampleCode) => {
    if (sampleCode && sampleCode.clients) {
      let kk = Object.keys(sampleCode.clients);
      if (kk && kk.length > 0) {
        if (this.state.selLang == null || !kk.includes(this.state.selLang)) {
          setTimeout(() => {
            this.setState({
              selLang: kk[0],
            });
          }, 0);
        }
      }
      return kk.map((k1) => ({ label: k1, value: k1 }));
    }
  });

  memExampleCode = memoizeOne((isPnpPython, isSentimentAnalysis, isLangDetection, sampleCode) => {
    if (sampleCode && !this.props.paramsProp?.get('fromPredDash')) {
      let exampleData = sampleCode.exampleData || {};
      setTimeout(() => {
        this.setState({
          selExampleData: JSON.stringify(exampleData),
          selExampleDataOriginal: !Utils.isNullOrEmpty(exampleData) ? JSON.stringify(exampleData) : null,
        });
      }, 0);
      return exampleData;
    }
  });

  onChangeSelLang = (optionSel) => {
    this.setState({
      selLang: optionSel?.value,
    });
  };

  memDeploymentTokensList = memoizeOneCurry((doCall, deploymentsTokens, projectId) => {
    if (!projectId) {
      return null;
    }

    if (deploymentsTokens) {
      if (deploymentsTokens.get('isRefreshing')) {
        return;
      }
      //
      let res = calcDeploymentsTokensByProjectId(undefined, projectId);
      if (res == null) {
        if (doCall) {
          StoreActions.deployTokensList_(projectId);
        }
      } else {
        return res;
      }
    }
  });

  onChangeSelToken = (optionSel) => {
    this.setState({
      selToken: optionSel?.value,
    });
  };

  memApiMethodsRender = memoizeOne((predictionApiList, predictionApi) => {
    if (predictionApiList && _.isArray(predictionApiList) && predictionApiList.length > 1) {
      let options = predictionApiList.map((t1) => ({ label: t1, value: t1 }));

      let selOption = predictionApi ? options.find((o1) => o1.value === predictionApi) : null;
      let popupContainerForMenu = (node) => document.getElementById('body2');

      if (selOption == null && options && options.length > 0 && Utils.isNullOrEmpty(this.state.predictionApi)) {
        setTimeout(() => {
          this.setState({
            predictionApi: options[0].value,
          });
        }, 0);
      }

      return (
        <span style={{ display: 'inline-block', marginBottom: '20px' }}>
          <span style={{ marginRight: '5px', fontSize: '14px' }}>API Method Sample:</span>
          <span style={{ display: 'inline-block', width: '400px' }}>
            <SelectExt value={selOption} options={options} onChange={this.onChangeApiSel} menuPortalTarget={popupContainerForMenu(null)} />
          </span>
        </span>
      );
    }
  });

  onChangeApiSel = (optionSel) => {
    let v1 = optionSel?.value;
    if (this.state.predictionApi === v1) {
      return;
    }

    this.setState(
      {
        // selExampleData: null,
        // selExampleDataOriginal: null,
        selResult: null,
        isResultReplied: false,
      },
      () => {
        this.setState({
          predictionApi: v1,
        });
      },
    );
  };

  memTokensRender = memoizeOne((isPnpPython, isSentimentAnalysis, isLangDetection, tokensList, selToken) => {
    if (tokensList) {
      let options = tokensList.map((t1) => ({ label: t1.deploymentToken, value: t1.deploymentToken }));
      if (options.length === 0) {
        options.unshift({ label: TOKEN_NO_TOKEN, value: TOKEN_NO_TOKEN });
      }

      let selOption = selToken ? options.find((o1) => o1.value === selToken) : null;
      let popupContainerForMenu = (node) => document.getElementById('body2');

      if (selOption == null && options && options.length > 0) {
        setTimeout(() => {
          this.setState({
            selToken: options[0].value,
          });
        }, 0);
      }

      return (
        <span style={{ marginLeft: (isPnpPython || isLangDetection ? 0 : 20) + 'px', display: 'inline-block', marginBottom: '20px' }}>
          <span style={{ marginRight: '5px' }}>Token:</span>
          <span style={{ display: 'inline-block', width: '400px' }}>
            <SelectExt value={selOption} options={options} onChange={this.onChangeSelToken} menuPortalTarget={popupContainerForMenu(null)} />
          </span>
        </span>
      );
    }
  });

  onChangeExampleData = (e) => {
    this.setState({
      selExampleData: e.target.value,
    });
  };

  onClickCreateToken = (e) => {
    let projectId = this.props.paramsProp && this.props.paramsProp.get('projectId');
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

  onClickResetToDefault = (e) => {
    if (this.state.selExampleDataOriginal) {
      this.setState({
        selExampleData: this.state.selExampleDataOriginal,
      });
    }
  };

  memDeployOptions = memoizeOne((listDeployments) => {
    if (listDeployments) {
      return listDeployments.map((d1) => {
        return {
          label: d1.name || '-',
          value: d1.deploymentId,
        };
      });
    }
  });

  onChangeSelectDeployment = (optionSel) => {
    if (!optionSel) {
      return;
    }

    this.setState({
      isProcessing: false,
      selResult: null,
      isResultReplied: false,
    });

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let deployId = optionSel?.value;
    if (projectId && deployId) {
      Location.push('/' + PartsLink.deploy_predictions_api + '/' + projectId + '/' + deployId);
    }
  };

  memUseCaseSel = memoizeOneCurry((doCall, useCases, useCase) => {
    if (useCases && useCase) {
      if (useCases.get('isRefreshing')) {
        return;
      }

      if (useCases.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
      } else {
        let list = useCases.get('list');
        if (list) {
          let selUseCase = list.find((u1) => u1.useCase === useCase);
          if (selUseCase) {
            let predictionApis = selUseCase.predictionApi;
            if (predictionApis != null && _.isArray(predictionApis)) {
              setTimeout(() => {
                this.setState({
                  predictionApiList: predictionApis,
                  predictionApi: predictionApis?.[0],
                  predictionApiOptions: predictionApis,
                });
              }, 0);
            }
          }
          return selUseCase;
        }
      }
    }
  });

  render() {
    let { paramsProp, deployments } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let deployId = paramsProp && paramsProp.get('deployId');
    // figure out why calling the curried function isn't working
    let isExplainable = projects.memExplainableProject(true, null, deployId);
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    const isPnpPython = foundProject1?.isPnpPython === true;
    const isSentimentAnalysis = foundProject1?.useCase === 'NLP_SENTIMENT';
    const isLangDetection = foundProject1?.useCase === 'LANGUAGE_DETECTION';

    let useCaseOne = this.memProjectUseCase(foundProject1);
    let selUseCase = this.memUseCaseSel(false)(this.props.useCases, useCaseOne);

    let showSampleEditor = !Utils.isNullOrEmpty(this.state.selExampleDataOriginal) || isPnpPython || isSentimentAnalysis || isLangDetection;

    let listDeployments = this.memDeploymentList(false)(deployments, deployId, projectId);
    let predictionsRender = null,
      tokensRender = null;
    let langList = null,
      langSelOption = null;
    let tokensList = null;
    let sampleUsed = false;
    if (listDeployments != null && deployId == null) {
      sampleUsed = false;
      predictionsRender = (
        <div style={{ fontSize: '16px' }} className={sd.useSampleDataset}>
          There are no deployments in this project
        </div>
      );
    } else {
      sampleUsed = true;
      let sampleCodeList = this.memSampleCode(false)(this.props.deploymentsCode, deployId) || [null];
      let sampleCodeInd = 0;
      if (this.state.predictionApiList != null && _.isArray(this.state.predictionApiList) && this.state.predictionApiList.length > 1) {
        sampleCodeInd = this.state.predictionApiList.findIndex((s1) => s1 === this.state.predictionApi);
      }
      let sampleCode = sampleCodeList?.[sampleCodeInd] ?? null;
      langList = this.memLangList(sampleCode);
      let exampleCode = this.memExampleCode(isPnpPython, isSentimentAnalysis, isLangDetection, sampleCode);
      langSelOption = langList ? langList.find((l1) => l1.value === this.state.selLang) : null;

      predictionsRender = this.memPredictionsRender(
        this.state.isReadyForRun,
        showSampleEditor,
        isPnpPython,
        isSentimentAnalysis,
        isLangDetection,
        deployId,
        projectId,
        sampleCode,
        this.state.selLang,
        this.state.selToken,
        this.state.selExampleData,
        this.state.selResult,
        this.state.isProcessing,
        this.state.isResultReplied,
        this.state.predictionApi,
        isExplainable,
        this.state.explainPredictions,
      );

      tokensList = this.memDeploymentTokensList(false)(this.props.deploymentsTokens, projectId);
      tokensRender = this.memTokensRender(isPnpPython, isSentimentAnalysis, isLangDetection, tokensList, this.state.selToken);
    }

    let optionsDeploys = this.memDeployOptions(listDeployments);
    let optionsDeploysSel = optionsDeploys?.find((d1) => d1.value === deployId);

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let createTokenButton = null;
    if (sampleUsed) {
      if (tokensList && tokensList.length === 0) {
        createTokenButton = (
          <ModalConfirm onConfirm={this.onClickCreateToken} title={`Do you want to create a deployment token?`} icon={<QuestionCircleOutlined style={{ color: 'green' }} />} okText={'Create'} cancelText={'Cancel'} okType={'primary'}>
            <Button type={'primary'} style={{ marginLeft: '20px' }}>
              Create New Token
            </Button>
          </ModalConfirm>
        );
      }
    }

    let deploymentSelect = null;
    if (optionsDeploys && optionsDeploys.length > 1) {
      deploymentSelect = (
        <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
          <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={this.onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
        </span>
      );
    } else if (optionsDeploysSel != null) {
      deploymentSelect = (
        <span>
          &nbsp;<span style={{ color: Utils.colorA(0.7) }}>-</span>&nbsp;{optionsDeploysSel.label}
        </span>
      );
    }

    const apiMethodsListRender = this.memApiMethodsRender(this.state.predictionApiList, this.state.predictionApi);

    return (
      <div className={sd.table} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: '25px' }}>
        <RefreshAndProgress>
          <NanoScroller onlyVertical>
            <div style={{ position: 'relative' }}>
              <div className={sd.titleTopHeaderAfter} style={{ position: 'relative', height: topAfterHeaderHH }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>Predictions API</span>
                  {deploymentSelect}
                </div>

                <div style={{ position: 'absolute', right: 0, top: 0 }}>
                  <HelpBox name={'Prediction API'} linkTo={'/help/useCases/' + useCaseOne + '/predictions'} />
                </div>
              </div>

              {apiMethodsListRender != null && <div style={{ borderBottom: '1px solid ' + Utils.colorA(0.3), marginBottom: '20px' }}>{apiMethodsListRender}</div>}
              <div>
                {langList && !isLangDetection && (
                  <span style={{ display: 'inline-block', width: '200px', marginBottom: '20px' }}>
                    <SelectExt value={langSelOption} options={langList} onChange={this.onChangeSelLang} menuPortalTarget={popupContainerForMenu(null)} />
                  </span>
                )}
                {tokensRender}
                {createTokenButton}
              </div>
              {showSampleEditor && (
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ marginTop: '20px', fontSize: '16px', marginBottom: '5px' }}>
                    {isPnpPython ? 'Request JSON' : 'Sample Input Data'}:<HelpIcon id={isSentimentAnalysis ? 'predapi_sentana' : isPnpPython ? 'predapi_reqinput' : 'predapi_sampleinput'} style={{ marginLeft: '4px' }} />
                  </div>
                  <Input.TextArea style={{ height: '120px' }} value={this.state.selExampleData} onChange={this.onChangeExampleData} />
                  {!isPnpPython && !isLangDetection && (
                    <Button style={{ marginTop: '10px' }} type={'default'} ghost onClick={this.onClickResetToDefault}>
                      Reset data to default
                    </Button>
                  )}
                </div>
              )}
              {predictionsRender}
            </div>
          </NanoScroller>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    deployments: state.deployments,
    deploymentsCode: state.deploymentsCode,
    deploymentsTokens: state.deploymentsTokens,
    projects: state.projects,
    useCases: state.useCases,
    requests: state.requests,
  }),
  null,
)(DeployPredictionsAPI);
