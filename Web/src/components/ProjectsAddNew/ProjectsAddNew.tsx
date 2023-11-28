import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import _ from 'lodash';
import * as moment from 'moment-timezone';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcSolutionsList, memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import HelpTooltip from '../HelpTooltip/HelpTooltip';
import { calcIsDockerPnpUseCase, calcIsPnpPythonNotebookUseCase } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./ProjectsAddNew.module.css');
const sd = require('../antdUseDark.module.css');

const PNP_useCase = 'UCPLUGANDPLAY';
const Pretrained_useCase = 'PRETRAINED';

export enum ProblemDefSteps {
  ChooseUseCase = 3,
  ChoosePnp = 9,
  ChoosePretrainedUseCase = 11,
  CreateProject = 5,
  Finish = 7,
}

const defaultFirstStep = () => {
  return ProblemDefSteps.ChooseUseCase;
};

interface IProjectsAddNewProps {
  paramsProp?: any;
  useCases?: any;
  datasets?: any;
  authUser?: any;
}

interface IProjectsAddNewState {
  useCaseSelected?: any;
  actualStep?: ProblemDefSteps;
  isRefreshing?: boolean;
}

class ProjectsAddNew extends React.PureComponent<IProjectsAddNewProps, IProjectsAddNewState> {
  private unDark: any;
  private isM: boolean;
  private alreadyRefreshedParams: boolean;
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    let { paramsProp } = props;
    let useTimezoneForAPI = 'UTC';

    let calcParam = (name, isDate = false) => {
      let res = paramsProp ? paramsProp.get(name) : null;
      if (isDate && res != null) {
        res = moment.unix(res).tz(useTimezoneForAPI || 'UTC', false);
      }
      return res;
    };

    let actualStep = calcParam('actualStep');
    actualStep = (actualStep == null ? actualStep : Utils.tryParseInt(actualStep, actualStep)) ?? defaultFirstStep();

    let useCaseSelected = calcParam('useCaseSelected');

    if (actualStep === ProblemDefSteps.ChoosePnp) {
      if (useCaseSelected === PNP_useCase) {
        useCaseSelected = null;
      }
    }
    if (actualStep === ProblemDefSteps.ChoosePretrainedUseCase) {
      if (useCaseSelected === Pretrained_useCase) {
        useCaseSelected = null;
      }
    }

    this.state = {
      useCaseSelected: useCaseSelected,
      actualStep: actualStep,
    };
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

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let solutionsList = this.memSolutionsList(true)(this.props.useCases);
    let schemaInfoFull = this.memUseCaseInfo(true)(this.props.useCases, this.calcCaseSelected());
  };

  calcCaseSelected = () => {
    let useCaseSelected = this.state.useCaseSelected;
    if (useCaseSelected?.toLowerCase() === 'vision_segmentation') {
      useCaseSelected = 'vision'.toUpperCase();
    }
    return useCaseSelected;
  };

  memUseCaseInfo = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  componentDidUpdate(prevProps: Readonly<IProjectsAddNewProps>, prevState: Readonly<IProjectsAddNewState>, snapshot?: any): void {
    this.doMem();
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;
    this.refreshUrlWithParams();

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;
    this.unDark();
  }

  onClickContinueButton = (e) => {
    let nextStep: ProblemDefSteps = this.calcActualStep();
    if (nextStep == null) {
      nextStep = defaultFirstStep();
    }

    let useCaseSelected = this.calcCaseSelected();

    switch (nextStep) {
      case ProblemDefSteps.ChooseUseCase:
        if (this.calcCaseSelected()?.toUpperCase() === PNP_useCase) {
          nextStep = ProblemDefSteps.ChoosePnp;
          useCaseSelected = null;
        } else if (this.calcCaseSelected()?.toUpperCase() === Pretrained_useCase) {
          nextStep = ProblemDefSteps.ChoosePretrainedUseCase;
          useCaseSelected = null;
        } else {
          nextStep = ProblemDefSteps.CreateProject;
        }
        break;
      case ProblemDefSteps.ChoosePnp:
        if (this.props.paramsProp?.get('dd') === 'pnp') {
          Location.push('/' + PartsLink.dataset_for_usecase + '/' + this.props.paramsProp?.get('projectId'), undefined, 'useCase=MODEL_WITH_EMBEDDINGS&useCaseTag=true&dd=pnp');
          return;
        }
        nextStep = ProblemDefSteps.CreateProject;
        break;
      case ProblemDefSteps.ChoosePretrainedUseCase:
        nextStep = ProblemDefSteps.CreateProject;
        break;
      case ProblemDefSteps.CreateProject:
        nextStep = ProblemDefSteps.Finish;
        break;
    }

    if (this.state.actualStep !== nextStep) {
      this.refreshUrlWithParams({
        actualStep: nextStep,
        useCaseSelected,
      });
    }
  };

  calcActualStep = (): ProblemDefSteps => {
    return this.state.actualStep;
  };

  onClickCreateProject = (askStreaming, values) => {
    let selUseCase = this.calcCaseSelected();
    if (!selUseCase) {
      REActions.addNotificationError('You need to select a use case first');
      return;
    }

    let name = values.name;

    this.setState({
      isRefreshing: true,
    });

    let schemaInfoFull = this.memUseCaseInfo(false)(this.props.useCases, this.calcCaseSelected());

    let isFeatureGroupProject = schemaInfoFull?.uiCustom?.use_feature_groups === true;

    if (askStreaming) {
      if (values.isStreaming === true) {
        isFeatureGroupProject = false;
      }
    }

    REClient_.client_().createProject(name, selUseCase, isFeatureGroupProject, (errUpload, resUpload) => {
      this.setState({
        isRefreshing: false,
      });

      if (errUpload || !resUpload || !resUpload.result || !resUpload.result.projectId) {
        REActions.addNotificationError(errUpload || Constants.errorDefault);
      } else {
        let projectId = resUpload.result.projectId;

        StoreActions.setCreateActionState_(projectId, {});

        StoreActions.listProjectsAll_();
        StoreActions.getProjectsById_(projectId);
        StoreActions.getProjectsList_();
        //set dataset
        let { paramsProp } = this.props;
        let search = Utils.processParamsAsQuery({
          useCaseTag: true,
          datasetType: paramsProp.get('datasetType'),
          useCase: selUseCase,
          // pnp: 1, //TODO remove //**
        });

        if (calcIsPnpPythonNotebookUseCase(selUseCase)) {
          Location.push('/' + PartsLink.notebook_one + '/' + projectId);
        } else if (calcIsDockerPnpUseCase(selUseCase)) {
          Location.push('/' + PartsLink.docker_add + '/' + projectId);
        } else if (['FEATURE_STORE'.toLowerCase(), 'PYTHON_MODEL'.toLowerCase(), 'AI_AGENT'.toLowerCase()].includes((selUseCase || '').toLowerCase())) {
          Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
        } else if ((selUseCase || '').toLowerCase() === 'predicting') {
          Location.push('/' + PartsLink.dataset_schema_wizard + '/' + projectId, undefined, search);
        } else if ((selUseCase || '').toLowerCase().startsWith('pretrained')) {
          Location.push('/' + PartsLink.pretrained_models_add + '/' + projectId);
        } else {
          Location.push('/' + PartsLink.dataset_for_usecase + '/' + projectId, undefined, search);
        }
      }
    });
  };

  refreshUrlWithParams = (doPush = null, force = false) => {
    if (!this.isM && !force) {
      return;
    }

    let stateNew = _.extend({}, this.state || {}, doPush || {});

    let { paramsProp } = this.props;

    let url = window.location.pathname;
    let params: any = {},
      actualValues = {};
    if (stateNew.useCaseSelected != null) {
      params.useCaseSelected = stateNew.useCaseSelected;
      if (paramsProp) {
        actualValues['useCaseSelected'] = paramsProp.get('useCaseSelected');
      }
    }
    if (stateNew.actualStep != null) {
      params.actualStep = stateNew.actualStep;
      if (paramsProp) {
        actualValues['actualStep'] = Utils.tryParseInt(paramsProp.get('actualStep'), paramsProp.get('actualStep'));
      }
    }

    let search = Utils.processParamsAsQuery(params);

    if (paramsProp) {
      if (_.isEqual(actualValues, params)) {
        if (!this.alreadyRefreshedParams) {
          if (doPush != null) {
            this.alreadyRefreshedParams = true;
          } else {
            setTimeout(() => {
              if (this.isM) {
                this.alreadyRefreshedParams = true;
              }
            }, 0);
          }
        }
        return;
      }
    }

    if (doPush != null) {
      this.alreadyRefreshedParams = true;
      Location.push(url, undefined, search);
    } else {
      Location.replace(url, undefined, search);
      REActions.reprocessParams();

      if (!this.alreadyRefreshedParams) {
        setTimeout(() => {
          if (this.isM) {
            this.alreadyRefreshedParams = true;
          }
        }, 0);
      }
    }
  };

  memCheckParamsToState = memoizeOne((props) => {
    if (!this.isM || !this.alreadyRefreshedParams) {
      return;
    }

    let { paramsProp } = this.props;
    let params = {},
      actualValues = {};
    if (paramsProp) {
      if (paramsProp.get('useCaseSelected') != null) {
        params['useCaseSelected'] = paramsProp.get('useCaseSelected');
        actualValues['useCaseSelected'] = this.calcCaseSelected();
      }
      if (paramsProp.get('actualStep') != null) {
        params['actualStep'] = Utils.tryParseInt(paramsProp.get('actualStep'), paramsProp.get('actualStep'));
        actualValues['actualStep'] = this.state.actualStep;

        if (Utils.isNullOrEmpty(params['useCaseSelected']) && !this.calcIsActualStepSubGroup(params['actualStep'])) {
          if (params['useCaseSelected'] != null) {
            params['useCaseSelected'] = null;
          }
        }
      }
    }

    if (!_.isEqual(actualValues, params)) {
      setTimeout(() => {
        this.setState(params);
      }, 0);
    }
  });

  calcIsActualStepSubGroup = (forceStep?) => {
    let actualStep = forceStep ?? this.calcActualStep();
    return [ProblemDefSteps.ChoosePnp, ProblemDefSteps.ChoosePretrainedUseCase].includes(actualStep);
  };

  calcIsUseCaseGroup = (useCase1) => {
    const useCaseUpper = useCase1?.toUpperCase();
    return useCaseUpper === PNP_useCase || useCaseUpper === Pretrained_useCase;
  };

  memSolutionsList = memoizeOneCurry((doCall, useCases) => {
    if (useCases) {
      let res = calcSolutionsList();
      if (res == null) {
        if (useCases.get('isRefreshing') === 0) {
          if (doCall) {
            StoreActions.solutionsList_();
          }
          return;
        }
      }
      return res;
    }
  });

  onChangeRadio = (useCaseOne, isPnp, e) => {
    this.setState({
      useCaseSelected: useCaseOne,
    });
  };

  memUseCasesGridCalc = memoizeOne((solutionsList, useCaseSelected) => {
    let useCasesGrid = null,
      useCasesGroupGridMap = {},
      useCasesGridPlatform = null;
    if (solutionsList) {
      solutionsList = solutionsList?.toJS();

      let renderLinkOrNot = (title, link, useClass, showChecks = false, value = false, helpId, onClick = null, isSel) => {
        let res = null;
        if (link && !showChecks) {
          res = (
            <a className={'linkNon label ' + (useClass ?? '')} href={link}>
              {title}
            </a>
          );
        } else {
          res = (
            <span className={'label ' + (useClass ?? '')}>
              <HelpTooltip placement={'bottom'} id={helpId}>
                {title}
              </HelpTooltip>
            </span>
          );
        }

        if (showChecks) {
          res = (
            <div>
              <Radio onChange={onClick} checked={isSel ?? false}>
                {res}
                <span style={{ marginLeft: '5px' }}>
                  <HelpIcon id={helpId} />
                </span>
              </Radio>
            </div>
          );
        }

        return res;
      };

      let renderSolItem = (item, sol1ind, show_line, showChecks = false, bottomPadding = 12) => {
        let useCaseUpper = item?.useCase?.toUpperCase() || '';
        let isUseCaseGroup = this.calcIsUseCaseGroup(useCaseUpper);

        let isSolSameUseCase = showChecks && (!item.subitems || item.subitems.length == 0);
        if (isUseCaseGroup) {
          if (item?.subitems?.length === 1 && item?.subitems?.[0]?.useCase?.toUpperCase() === 'PYTHON_MODEL') {
            isUseCaseGroup = false;
            isSolSameUseCase = false;
          } else {
            isSolSameUseCase = true;
          }
        }

        let isSel = (uc) => {
          return useCaseSelected === uc;
        };

        let pnpRemoveName = (n1) => {
          if (_.startsWith(n1, 'Plug & Play Your ')) {
            n1 = n1.substring('Plug & Play Your '.length);
          }
          return n1;
        };

        let subitems = (
          <div style={{ marginBottom: '5px' }}>
            {item?.subitems?.map((subitem, subitemind) => {
              return (
                <div
                  key={'subitem_' + sol1ind + '_' + subitemind}
                  style={{ paddingLeft: 52 + 14 + 'px' }}
                  className={s.spaceBottom12}
                  css={`
                    ${isUseCaseGroup ? `display: flex; align-items: center;` : ''}
                  `}
                >
                  {isUseCaseGroup && <img src={calcImgSrc('/app/imgs/' + subitem.imgSrc + (isUseCaseGroup ? '' : '_s.png'))} alt="" style={{ width: '40px', height: '40px', display: 'inline-block', marginRight: '12px' }} />}
                  {renderLinkOrNot(pnpRemoveName(subitem.name), null, s.subitemMenu, showChecks, subitem.useCase, 'usecase_' + subitem.useCase, this.onChangeRadio.bind(this, subitem.useCase, isUseCaseGroup), isSel(subitem.useCase))}
                </div>
              );
            })}
          </div>
        );
        if (isUseCaseGroup) {
          let subitem = item?.subitems?.[0];
          if (useCasesGroupGridMap != null) {
            useCasesGroupGridMap[useCaseUpper] = (
              <div
                className={s.topSubItems}
                css={`
                  display: flex;
                  justify-content: center;
                `}
              >
                <span css={``}>{subitems}</span>
              </div>
            );
          }
        }

        return (
          <div key={'item_usecase_' + sol1ind} style={{ width: '100%' }}>
            <div style={{ display: 'flex', width: '100%', whiteSpace: 'nowrap', justifyContent: 'flex-start', alignItems: 'center' }}>
              <img src={calcImgSrc('/app/imgs/' + item.imgSrc + '_s.png')} alt="" style={{ width: '40px', height: '40px', display: 'inline-block', marginRight: '12px' }} />
              <b>{renderLinkOrNot(item.name, null, s.subitemMenuTitle, isSolSameUseCase, item.url, 'solution_' + item.url, isSolSameUseCase ? this.onChangeRadio.bind(this, item.useCase, isUseCaseGroup) : null, isSel(item.useCase))}</b>
            </div>
            {!isUseCaseGroup && subitems}
            {show_line && <div style={{ margin: '5px 0 13px 0', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', height: '1px' }}></div>}
          </div>
        );
      };

      const renderGrid = (solutionsList) => {
        return (
          <div style={{ padding: '35px 35px 10px 35px' }}>
            <div style={{ display: 'flex', whiteSpace: 'nowrap', justifyContent: 'space-evenly', alignItems: 'flex-start' }}>
              <div className={s.topSubItems} style={{ display: 'flex', width: '380px', whiteSpace: 'nowrap', justifyContent: 'flex-start', alignItems: 'flex-start', flexFlow: 'column', marginRight: '20px' }}>
                {solutionsList?.map((sol1, sol1ind) => {
                  if (sol1ind % 2 === 0) {
                    return renderSolItem(sol1, sol1ind, sol1ind < solutionsList.length - 2, true, 1);
                  }
                })}
              </div>
              <div className={s.topSubItems} style={{ display: 'flex', width: '380px', whiteSpace: 'nowrap', justifyContent: 'flex-start', alignItems: 'flex-start', flexFlow: 'column' }}>
                {solutionsList?.map((sol1, sol1ind) => {
                  if (sol1ind % 2 === 1) {
                    return renderSolItem(sol1, sol1ind, sol1ind < solutionsList.length - 2, true, 1);
                  }
                })}
              </div>
            </div>
          </div>
        );
      };

      let useCasePlatforms = ['FEATURE_STORE', 'UCPLUGANDPLAY', 'FEATURE_DRIFT', 'PRETRAINED'];
      let solutionsListPlatform = solutionsList?.filter((s1) => useCasePlatforms.includes(s1.useCase));
      solutionsList = solutionsList?.filter((s1) => !useCasePlatforms.includes(s1.useCase));

      //
      useCasesGrid = renderGrid(solutionsList);
      useCasesGridPlatform = renderGrid(solutionsListPlatform);
    }
    return { useCasesGrid, useCasesGroupGridMap, useCasesGridPlatform };
  });

  render() {
    this.memCheckParamsToState(this.props);

    let { datasets, paramsProp, useCases } = this.props;

    const whiteBlack = Utils.isDark() ? 'white' : 'black';

    let actualStep = this.calcActualStep();
    if (actualStep == null) {
      actualStep = defaultFirstStep();
    }

    let solutionsList = this.memSolutionsList(false)(useCases);

    let createDesign = null;
    let initialName = '';

    let { useCasesGridPlatform, useCasesGrid, useCasesGroupGridMap } = this.memUseCasesGridCalc(solutionsList, this.state.useCaseSelected) ?? {};

    let askStreaming = false;

    if (this.state.useCaseSelected && solutionsList != null) {
      solutionsList.some((sol1) => {
        let useCases1 = null;
        if (sol1 && sol1.get('subitems')) {
          useCases1 = sol1.get('subitems').find((u1) => u1.get('useCase') === this.state.useCaseSelected);
        } else if (sol1.get('useCase') === this.state.useCaseSelected) {
          useCases1 = sol1;
        }
        if (useCases1) {
          createDesign = (
            <div>
              <div style={{ margin: '10px 0 25px 0', fontFamily: 'Matter', fontSize: '24px', color: '#FFFFFF', letterSpacing: 0, textAlign: 'center', lineHeight: '32px' }}>{sol1.get('name')}</div>
              <div style={{ textAlign: 'center' }}>
                <div className={s.useCasesImg} style={{ position: 'relative', display: 'inline-block', marginBottom: '5px', borderRadius: '14px', overflow: 'hidden', width: '160px', height: '150px', backgroundColor: '#FAFAFA' }}>
                  <img
                    className={''}
                    alt={''}
                    src={calcImgSrc('/imgs/' + useCases1.get('imgSrc') + (useCases1 === sol1 ? '_s.png' : ''))}
                    style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: '-45px', marginTop: '-45px', objectFit: 'contain', width: '90px', height: '90px', zIndex: 1 }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '5px', fontFamily: 'Matter', fontSize: '16px', color: '#FFFFFF', letterSpacing: '0.24px', textAlign: 'center' }}>{useCases1.get('name')}</div>
              <div style={{ width: '410px', margin: '0 auto', fontFamily: 'Roboto', fontSize: '14px', color: '#8798AD', letterSpacing: 0, textAlign: 'center', lineHeight: '22px' }}>{useCases1.get('title')}</div>
            </div>
          );
        }
      });
    }

    return (
      <div style={{ textAlign: 'center', marginTop: '22px' }}>
        {actualStep === ProblemDefSteps.ChooseUseCase && (
          <div style={{ marginLeft: '24px', textAlign: 'left' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ color: whiteBlack, fontSize: '26px', textAlign: 'center', marginBottom: '5px' }}>
                <span>
                  Choose a Solution Use-Case&nbsp;
                  <HelpIcon id={'yourusecase'} />
                </span>
              </div>
              <div className={'clearfix'}>{useCasesGrid}</div>

              <div style={{ color: whiteBlack, fontSize: '26px', textAlign: 'center', marginBottom: '5px', marginTop: '15px' }}>
                <span>
                  or Choose a Platform Use-Case&nbsp;
                  <HelpIcon id={'yourusecaseplatform'} />
                </span>
              </div>
              <div className={'clearfix'}>{useCasesGridPlatform}</div>

              <div style={{ paddingTop: '40px', textAlign: 'center', margin: '0 auto' }}>
                <Button onClick={this.onClickContinueButton} disabled={this.calcCaseSelected() == null} type={'primary'} style={{ width: '486px' }}>
                  Continue
                </Button>
              </div>

              <div
                css={`
                  margin-top: 90px;
                `}
              >
                &nbsp;
              </div>
            </div>
          </div>
        )}

        {actualStep === ProblemDefSteps.ChoosePnp && (
          <div style={{ marginLeft: '24px', textAlign: 'left' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ color: whiteBlack, fontSize: '26px', textAlign: 'center', marginBottom: '38px' }}>
                <span>
                  Choose Plug And Play use case &nbsp;
                  <HelpIcon id={'yourusecase_pnp'} />
                </span>
              </div>
              <div className={'clearfix'}>{useCasesGroupGridMap?.[PNP_useCase]}</div>

              <div style={{ paddingTop: '40px', textAlign: 'center', margin: '0 auto' }}>
                <Button onClick={this.onClickContinueButton} disabled={this.calcCaseSelected() == null || (this.calcIsUseCaseGroup(this.calcCaseSelected()) && this.calcIsActualStepSubGroup())} type={'primary'} style={{ width: '486px' }}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {actualStep === ProblemDefSteps.ChoosePretrainedUseCase && (
          <div style={{ marginLeft: '24px', textAlign: 'left' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ color: whiteBlack, fontSize: '26px', textAlign: 'center', marginBottom: '38px' }}>
                <span>
                  Choose Foundation Model use case &nbsp;
                  <HelpIcon id={'yourusecase_pretrained'} />
                </span>
              </div>
              <div className={'clearfix'}>{useCasesGroupGridMap?.[Pretrained_useCase]}</div>

              <div style={{ paddingTop: '40px', textAlign: 'center', margin: '0 auto' }}>
                <Button onClick={this.onClickContinueButton} disabled={this.calcCaseSelected() == null || (this.calcIsUseCaseGroup(this.calcCaseSelected()) && this.calcIsActualStepSubGroup())} type={'primary'} style={{ width: '486px' }}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {actualStep === ProblemDefSteps.CreateProject && (
          <div style={{ position: 'relative' }}>
            <RefreshAndProgress isRefreshing={this.state.isRefreshing}>
              {this.props.useCases != null && this.props.useCases.get('isRefreshing') === 0 && (
                <div>
                  <div style={{ color: whiteBlack, fontSize: '26px', marginTop: (createDesign == null ? 160 : 30) + 'px' }}>
                    <div style={{ display: 'table', margin: '0 auto' }}>
                      <span style={{ display: 'table-cell' }}>
                        <div style={{ textAlign: 'left', lineHeight: '32px' }}>{createDesign || 'Name your project'}</div>
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '16px', fontSize: '22px', maxWidth: '432px', margin: '30px auto 0', textAlign: 'left' }} className={sd.grayPanel}>
                    <FormExt
                      layout={'vertical'}
                      ref={this.formRef}
                      onFinish={this.onClickCreateProject.bind(this, askStreaming)}
                      className="login-form"
                      initialValues={{
                        name: initialName,
                      }}
                    >
                      <Form.Item
                        rules={[{ required: true, message: 'Name required!' }]}
                        name={'name'}
                        style={{ marginBottom: '10px' }}
                        hasFeedback
                        label={<span style={{ color: Utils.isDark() ? 'white' : 'black', fontFamily: 'Roboto', fontSize: '12px', letterSpacing: '1.12px' }}>PROJECT NAME</span>}
                      >
                        <Input placeholder="" autoComplete={'off'} />
                      </Form.Item>

                      {askStreaming && (
                        <Form.Item valuePropName={'checked'} name={'isStreaming'} style={{ marginBottom: '10px' }}>
                          <Checkbox>
                            <span
                              css={`
                                color: white;
                              `}
                            >
                              Use Streaming
                            </span>
                          </Checkbox>
                        </Form.Item>
                      )}

                      <div style={{ marginTop: '30px' }}>
                        <Button htmlType={'submit'} type={'primary'} style={{ width: '100%' }}>
                          Finish
                        </Button>
                      </div>
                    </FormExt>
                  </div>
                </div>
              )}
            </RefreshAndProgress>
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    authUser: state.authUser,
    paramsProp: state.paramsProp,
    useCases: state.useCases,
    datasets: state.datasets,
  }),
  null,
)(ProjectsAddNew);
