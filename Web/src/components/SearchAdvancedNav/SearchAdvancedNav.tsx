import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Tabs from 'antd/lib/tabs';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import { memUseCases } from '../../stores/reducers/useCases';
import CopyText from '../CopyText/CopyText';
import InputDateExt from '../InputDateExt/InputDateExt';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
import TextMax from '../TextMax/TextMax';
const s = require('./SearchAdvancedNav.module.css');
const sd = require('../antdUseDark.module.css');
const { TabPane } = Tabs;

interface ISearchAdvancedNavProps {}

const SearchAdvancedNav = React.memo((props: PropsWithChildren<ISearchAdvancedNavProps>) => {
  const { paramsProp, authUser, useCasesParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    useCasesParam: state.useCases,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  let calcParam = (name, isDate = false) => {
    let res = paramsProp ? paramsProp.get(name) : null;
    if (isDate && res != null) {
      res = moment.unix(res);
    }
    return res;
  };

  const [tabActive, setTabActive] = useState('s');

  const [sid, setSid] = useState(calcParam('sid'));
  const [urlCheck, setUrlCheck] = useState(calcParam('urlCheck'));

  const [searchFormResults, setSearchFormResults] = useState(null);
  const [searchForm, setSearchForm] = useState(null);

  const [searchFormState, setSearchFormState] = useState(() => {
    let res = Utils.dataNum('advSearchForm');
    return res ?? {};
  });

  const styleInput = {
    marginBottom: '7px',
  };

  const lastMethodUsed = useRef(null);
  const onChangeOrgHappened = () => {
    lastMethodUsed.current?.();
  };

  useEffect(() => {
    let unRef = REActions.onChangeOrgHappened.listen(onChangeOrgHappened);

    return () => {
      unRef();
    };
  }, []);

  useEffect(() => {
    memUseCases(true);
  }, [useCasesParam]);

  const useCasesList = useMemo(() => {
    return memUseCases(false);
  }, [useCasesParam]);

  const { optionsUseCase, optionsProblemType } = useMemo(() => {
    let optionsUseCase = [],
      optionsProblemType = [];

    useCasesList?.some((u1) => {
      // let info1 = u1.infoJson;
      // if(info1==null && _.isString(u1.info)) {
      //   info1 = Utils.tryJsonParse(u1.info);
      //   u1.infoJson = info1;
      // }

      optionsUseCase.push({
        label: u1.prettyName,
        value: u1.useCase,
      });
    });
    optionsUseCase = optionsUseCase.sort((a, b) => {
      return (a.label?.toLowerCase() || '').localeCompare(b.label?.toLowerCase() || '');
    });
    optionsUseCase.unshift({ label: '(Select)', value: null });

    ['plug_and_play', 'regression', 'forecasting', 'anomaly', 'personalization', 'affinity'].sort().some((s1) => {
      optionsProblemType.push({
        label: s1,
        value: s1,
      });
    });
    optionsProblemType.unshift({ label: '(Select)', value: null });

    return { optionsUseCase, optionsProblemType };
  }, [useCasesList]);

  const onClickUrlCheck = (e) => {
    if (_.trim(urlCheck || '') !== '') {
      let url1 = _.trim(urlCheck);
      REActions.showOrgHint(null, null);
      REActions.searchAdv('urlCheck', url1);

      let search = Utils.processParamsAsQuery({ urlCheck: url1 }, window.location.search);
      let url = window.location.pathname;
      Location.replace(url, undefined, search);
    } else {
      REActions.addNotificationError('URL is empty');
    }
  };

  const calcValueForm = (fieldName) => {
    let res = searchFormState[fieldName ?? ''];
    if (fieldName === 'searchIn') {
      res = res || '';
    }
    return res;
  };
  const onChangeForm = (fieldName, isValue, e) => {
    const v1 = isValue ? e : e.target.value;

    setSearchFormState((state) => {
      let s1 = { ...(state ?? {}) };
      s1[fieldName] = v1;
      return s1;
    });
  };

  const onChangeAdvForm = (v1) => {
    setSearchFormState((state) => {
      let actual1 = (state ?? {})['adv'];
      if (!_.isEqual(actual1, v1)) {
        setTimeout(() => {
          onChangeForm('adv', true, v1);
        }, 0);
      }

      return state;
    });
  };

  useEffect(() => {
    let unRe = REActions.onChangeAdvForm.listen(onChangeAdvForm);
    return () => {
      unRe();
    };
  }, []);

  const onClickShowAdvSearch = (e) => {
    REActions.showOrgHint(null, null);
    REActions.searchAdv('showSearch', searchFormState?.['adv'] ?? {});
  };

  const onClickSearchForm = (e) => {
    Utils.dataNum('advSearchForm', undefined, searchFormState);

    setSearchFormResults(null);
    setSearchForm(null);

    if (searchFormState != null && !_.isEmpty(searchFormState)) {
      REActions.showOrgHint(null, null);

      let state1: any = { ...searchFormState };
      if (state1.useCase) {
        state1.useCase = state1.useCase.value;
      }
      if (state1.problemType) {
        state1.problemType = state1.problemType.value;
      }
      REActions.searchAdv('searchForm', state1);

      setTabActive('p');
    } else {
      REActions.addNotificationError('Form is empty');
    }
  };

  const onClickSearchId = (e) => {
    REClient_.client_()._searchId(sid, (err, res) => {
      if (err || !res?.success || !res?.result) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let search = Utils.processParamsAsQuery({ sid: sid }, window.location.search);
        let url = window.location.pathname;
        Location.replace(url, undefined, search);

        REActions.showOrgHint(null, null);
        REActions.searchAdv('searchId', res?.result);
      }
    });
  };

  const onSearchAdv = (type, res) => {
    switch (type) {
      case 'searchId':
        lastMethodUsed.current = onClickSearchId;

        if (sid !== res?.hash) {
          setSid(res?.hash || '');
        }
        return;

      case 'urlCheck':
        lastMethodUsed.current = onClickUrlCheck;
        return;

      case 'searchForm':
        setSearchForm(res == null ? null : { ...res });
        return;
    }
  };

  useEffect(() => {
    let unReg = REActions.searchAdv.listen(onSearchAdv);

    return () => {
      unReg();
    };
  });

  const onClickClearForm = (e) => {
    Utils.dataNum('advSearchForm', undefined, {});
    setSearchFormState({});

    REActions.showOrgHint(null, null);
    REActions.searchAdv('showSearch', {});
  };

  const doShowSearchCenter = () => {
    REActions.showOrgHint(null, null);
    REActions.searchAdv('showSearch', searchFormState?.['adv'] ?? {});
  };

  useEffect(() => {
    if (searchForm) {
      const createdAt1 = searchForm['createdAt'];
      const createdAtBefore = createdAt1 != null && createdAt1['isBefore'] ? createdAt1['value'] : null;
      const createdAtAfter = createdAt1 != null && !createdAt1['isBefore'] ? createdAt1['value'] : null;

      REClient_.client_()._searchProjects(
        searchForm['searchIn'],
        searchForm['name'],
        searchForm['useCase'],
        searchForm['problemType'],
        createdAtBefore,
        createdAtAfter,
        searchForm['adv']?.['datasets'],
        searchForm['adv']?.['models'],
        searchForm['adv']?.['metrics'],
        searchForm['adv']?.['deploys'],
        (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            setSearchFormResults(res.result || []);
          }
        },
      );
    }
  }, [searchForm]);

  const onClickProjectShow = (projectId, e) => {
    if (Utils.isNullOrEmpty(projectId)) {
      return;
    }

    let search = Utils.processParamsAsQuery({ projectId: projectId }, window.location.search);
    let url = window.location.pathname;
    Location.replace(url, undefined, search);

    REActions.showOrgHint(null, null);
    REActions.searchAdv('showProjectDashboard', projectId);
  };

  const renderSearchForm = useMemo(() => {
    if (searchFormResults) {
      const selProjectId = paramsProp?.get('projectId');

      return (
        <div>
          {searchFormResults?.map((r1, r1ind) => {
            let projectIdHash = r1.project_id_hash;
            const isSel = selProjectId == projectIdHash;

            let extraElem = null;
            if (r1.dataset_id || r1.model_id || r1.deploy_id) {
              extraElem = (
                <div
                  css={`
                    margin-top: 15px;
                    border-top: 1px dotted gray;
                    padding-top: 15px;
                  `}
                >
                  {!Utils.isNullOrEmpty(r1.dataset_id) && (
                    <div
                      css={`
                        margin-bottom: 10px;
                      `}
                    >
                      <div>Dataset:</div>
                      <div>
                        ID <CopyText>{r1.dataset_id_hash}</CopyText> - Num: <CopyText>{'' + r1.dataset_id}</CopyText>
                      </div>
                      <div>Name: {r1.dataset_name}</div>
                    </div>
                  )}
                  {!Utils.isNullOrEmpty(r1.model_id) && (
                    <div
                      css={`
                        margin-bottom: 10px;
                      `}
                    >
                      <div>Model:</div>
                      <div>
                        ID <CopyText>{r1.model_id_hash}</CopyText> - Num: <CopyText>{'' + r1.model_id}</CopyText>
                      </div>
                      <div>Name: {r1.models_name}</div>
                    </div>
                  )}
                  {!Utils.isNullOrEmpty(r1.deploy_id) && (
                    <div
                      css={`
                        margin-bottom: 10px;
                      `}
                    >
                      <div>Deployment:</div>
                      <div>
                        ID <CopyText>{r1.deploy_id_hash}</CopyText> - Num: <CopyText>{'' + r1.deploy_id}</CopyText>
                      </div>
                      <div>Name: {r1.deploy_name}</div>
                    </div>
                  )}
                </div>
              );
            }

            let orgElem = null;
            if (searchForm?.['searchIn'] === 'my') {
              orgElem = (
                <div
                  css={`
                    margin-bottom: 5px;
                  `}
                >
                  <div style={{ fontSize: '16px' }} className={sd.styleTextGreen}>
                    Org Name:{' '}
                    <b>
                      <TextMax>{r1.organization_name}</TextMax>
                    </b>
                  </div>
                  <div>
                    ID: <CopyText>{r1.organization_id_hash}</CopyText> - Num: <CopyText>{'' + r1.project_id}</CopyText>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={'res_' + r1ind}
                css={`
                  margin: 20px 0;
                  border: 1px solid rgba(255, 255, 255, ${isSel ? 0.8 : 0.3});
                  border-radius: 4px;
                  padding: 10px;
                  cursor: pointer;
                  background-color: ${isSel ? '#1c3283' : 'transparent'};
                  :hover {
                    background-color: ${isSel ? '#1c3283' : 'rgba(255,255,255,0.1)'};
                    border: 1px solid rgba(255, 255, 255, 0.8);
                  }
                `}
                onClick={onClickProjectShow.bind(null, projectIdHash)}
              >
                {orgElem}
                <div style={{ fontSize: '16px' }} className={sd.styleTextGreen}>
                  Project Name: <b>{r1.project_name}</b>
                </div>
                <div>
                  ID: <CopyText>{projectIdHash}</CopyText> - Num: <CopyText>{'' + r1.project_id}</CopyText>
                </div>
                <div>UseCase: {r1.project_use_case}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>CreatedAt: {moment(r1.project_created_at).format('LLL')}</div>
                <div style={{ textAlign: 'center', fontSize: '16px' }}>
                  <Button
                    type={'primary'}
                    style={{ marginTop: '15px', height: '24px' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      let search = Utils.processParamsAsQuery({ projectId: projectIdHash }, window.location.search);
                      let url = window.location.pathname;
                      Location.replace(url, undefined, search);

                      REActions.showOrgHint(null, null);
                      REActions.searchAdv('showProjectDashboard', projectIdHash);
                    }}
                  >
                    Project Dashboard
                  </Button>
                </div>
                <div style={{ textAlign: 'center', fontSize: '16px' }}>
                  <Button
                    type={'default'}
                    style={{ marginTop: '10px', height: '24px' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      let search = Utils.processParamsAsQuery({ projectId: projectIdHash }, window.location.search);
                      let url = window.location.pathname;
                      Location.replace(url, undefined, search);

                      REActions.showOrgHint(null, null);
                      REActions.searchAdv('metricsHistory', projectIdHash);
                    }}
                  >
                    Project History
                  </Button>
                </div>
                <div style={{ textAlign: 'center', fontSize: '16px' }}>
                  <Link to={'/' + PartsLink.project_dashboard + '/' + projectIdHash} usePointer>
                    <Button type={'default'} style={{ marginTop: '10px', height: '24px' }} onClick={(e) => {}}>
                      Goto Project
                    </Button>
                  </Link>
                </div>
                {extraElem}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }, [searchFormResults, paramsProp?.get('projectId')]);

  const onChangeTabActive = (key) => {
    setTabActive(key);
  };

  // if(calcAuthUserIsLoggedIn()?.isInternal!==true) {
  //   return <div style={{ fontSize: '14px', color: Utils.colorA(1), }} className={sd.absolute}>
  //     <div css={`text-align: center; margin-top: 20px; font-size: 18px;`}>Invalid Permissions</div>
  //   </div>;
  // }

  return (
    <div
      style={{ fontSize: '14px', color: Utils.colorA(1) }}
      className={sd.absolute}
      css={`
        .ant-tabs-nav-wrap {
          display: flex;
          justify-content: center;
        }
      `}
    >
      <AutoSizer disableWidth>
        {({ height }) => {
          return (
            <Tabs
              centered
              activeKey={tabActive}
              onChange={onChangeTabActive}
              css={`
                .ant-tabs-tab-btn {
                  outline: none !important;
                }
              `}
            >
              <TabPane forceRender={true} tab="Search Form" key="s" style={{ position: 'relative', height: height - 63 + 'px' }}>
                <NanoScroller onlyVertical>
                  <div style={{ margin: '18px' }}>
                    <div className={sd.classGrayPanel} style={{ marginBottom: '8px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.07)' }}>
                      <Input
                        value={urlCheck}
                        onChange={(e) => {
                          setUrlCheck(e.target.value);
                        }}
                        placeholder={'URL'}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Button onClick={onClickUrlCheck} type={'primary'} style={{ marginTop: '5px', marginBottom: '18px' }}>
                        Check
                      </Button>
                    </div>

                    <div className={sd.classGrayPanel} style={{ marginBottom: '8px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.07)' }}>
                      <Input
                        value={sid}
                        onChange={(e) => {
                          setSid(e.target.value);
                        }}
                        placeholder={'ID / VersionID'}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Button onClick={onClickSearchId} type={'primary'} style={{ marginTop: '5px', marginBottom: '18px' }}>
                        Search
                      </Button>
                    </div>

                    <div className={sd.classGrayPanel} style={{ marginBottom: '8px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.07)' }}>
                      <div style={{ marginBottom: '6px' }}>Organization: (You need to belong)</div>
                      <Radio.Group value={calcValueForm('searchIn')} onChange={onChangeForm.bind(null, 'searchIn', false)} style={{ marginLeft: '5px', marginTop: '1px' }} buttonStyle="solid">
                        <Radio value={''}>
                          <span style={{ color: Utils.colorA(1) }}>Actual</span>
                        </Radio>
                        <br />
                        {/*<Radio value={'abacus'}><span style={{ color: Utils.colorA(0.5), }}>My Abacus Orgs</span></Radio><br />*/}
                        <Radio value={'my'}>
                          <span style={{ color: Utils.colorA(1) }}>My Orgs</span>
                        </Radio>
                      </Radio.Group>
                    </div>

                    <div className={sd.classGrayPanel} style={{ marginBottom: '8px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.07)' }}>
                      <div style={{ marginBottom: '6px' }}>Project:</div>
                      <Input value={calcValueForm('name')} onChange={onChangeForm.bind(null, 'name', false)} placeholder={'Name'} style={styleInput} />
                      <SelectExt value={calcValueForm('useCase') ?? { label: '(Select)', value: null }} onChange={onChangeForm.bind(null, 'useCase', true)} placeholder={'Use Case'} options={optionsUseCase} />
                      <div style={styleInput}></div>
                      <SelectExt value={calcValueForm('problemType') ?? { label: '(Select)', value: null }} onChange={onChangeForm.bind(null, 'problemType', true)} placeholder={'Problem Type'} options={optionsProblemType} />
                      <div style={styleInput}></div>
                      <InputDateExt value={calcValueForm('createdAt')} onChange={onChangeForm.bind(null, 'createdAt', true)} placeholder={'Created At'} style={styleInput} />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <Button onClick={onClickSearchForm} type={'primary'} style={{ marginTop: '5px' }}>
                        Search
                      </Button>
                      <Button onClick={onClickShowAdvSearch} type={'primary'} style={{ marginTop: '5px', marginLeft: '10px' }}>
                        Advanced {'>'}
                      </Button>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Button onClick={onClickClearForm} type={'default'} ghost style={{ marginTop: '8px' }}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </NanoScroller>
              </TabPane>

              <TabPane forceRender={true} tab="Projects" key="p" disabled={searchFormResults == null} style={{ position: 'relative', height: height - 63 + 'px' }}>
                <NanoScroller onlyVertical>
                  <div style={{ margin: '18px' }}>{renderSearchForm}</div>
                </NanoScroller>
              </TabPane>
            </Tabs>
          );
        }}
      </AutoSizer>
    </div>
  );
});

export default SearchAdvancedNav;
