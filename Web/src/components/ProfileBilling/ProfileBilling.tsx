import React, { CSSProperties, PropsWithChildren, Suspense, lazy, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import { useSelector } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import BillingList from '../BillingList/BillingList';
import { EUploadCloudServiceType } from '../DatasetNewOneUploadStep2/DatasetNewOneUploadStep2';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ProfileBillingWithStripeTypes } from './types';

const s = require('./ProfileBilling.module.css');
const sd = require('../antdUseDark.module.css');

const SubTitle = styled.div`
  color: #38bfa1;
  line-height: 1.05;
  font-size: 21px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  margin-bottom: 9px;
`;
const SubtitleDesc = styled.div`
  color: #38bfa1;
  line-height: 1.29;
  font-size: 14px;
  font-family: Matter, sans-serif;
  font-weight: 400;
  margin-bottom: 9px;
`;

const PriceTitle = styled.div`
  height: 59px;
  width: 357px;
  background-color: #23305e;
  border-radius: 1px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: #ffffff;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter, sans-serif;
  font-weight: 400;
`;

const PriceContent = styled.div`
  width: 357px;
  background-color: #0c121b;
  border-radius: 1px;
  padding: 21px 24px;
`;

const PriceName = styled.div`
  color: #8798ad;
  line-height: 1.38;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 600;
  margin-bottom: 3px;
`;

const PriceValue = styled.div`
  color: #ffffff;
  line-height: 1.38;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 400;
`;

const PriceLine = styled.div`
  margin-top: ${(props) => props.top ?? 0}px;
  margin-bottom: 12px;
`;

const PriceDesc = styled.div`
  color: #38bfa1;
  line-height: 1.13;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 400;
  margin-top: 22px;
  cursor: pointer;
`;

const TopTitle = styled.div`
  color: #ffffff;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter;
  font-weight: 400;
`;

const styleRectType: CSSProperties = {
  position: 'relative',
  backgroundColor: '#19232f',
  padding: '10px',
  flex: 1,
  marginRight: '10px',
  color: 'white',
  lineHeight: '1.2rem',
  textAlign: 'center',
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const SelectARegion = styled.div`
  color: #ffffff;
  letter-spacing: 1.12px;
  font-size: 12px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  line-height: 2;
  text-transform: uppercase;
`;

const OrgName = styled.div`
  color: #b2c9da;
  letter-spacing: 1.12px;
  font-size: 12px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  line-height: 2;
`;

interface IProfileBillingProps {
  isFull?: boolean;
}

const ProfileBillingWithStripeComponent: React.LazyExoticComponent<React.ComponentType<ProfileBillingWithStripeTypes>> = lazy(() =>
  import('./ProfileBillingWithStripe').then(({ ProfileBillingWithStripe }) => ({ default: ProfileBillingWithStripe })),
);

const ProfileBilling = React.memo((props: PropsWithChildren<IProfileBillingProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  let isMobile = Utils.isMobile();

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [regions, setRegions] = useState(null);
  const [refreshCards, incRefreshCards] = useReducer((x) => x + 1, 1);

  const [form] = Form.useForm();
  const [useCloudServiceSel, setUseCloudServiceSel] = useState<EUploadCloudServiceType>(EUploadCloudServiceType.AWS);

  const [stripeAuthKey, setStripeAuthKey] = useState<string>(null);
  const orgAlreadyCreated = useRef(false);

  const [rates, setRates] = useState(null);
  const [ratesFree, setRatesFree] = useState(null);

  const [showFormCC, setShowFormCC] = useState(false);

  useEffect(() => {
    REClient_.client_()._getRates((err, res) => {
      // console.log('re', res);
      if (!err && res?.result) {
        setRates(res?.result ?? null);
      } else {
        Utils.error(err || 'Error');
        setRates(null);
      }
    });
    REClient_.client_()._getFreeTier((err, res) => {
      // console.log('re.free', res);
      if (!err && res?.result) {
        setRatesFree(res?.result ?? null);
      } else {
        Utils.error(err || 'Error');
        setRatesFree(null);
      }
    });
  }, []);

  useEffect(() => {
    REClient_.client_()._getPublicKey((err, res) => {
      if (!err && res?.result) {
        setStripeAuthKey(res?.result);
      }
    });
  }, []);

  const authUserUsed = useRef(false);
  useEffect(() => {
    if (authUserUsed.current || !authUser || authUser.get('isRefreshing')) {
      return;
    }

    let cloudInfo = authUser.getIn(['data', 'organization', 'cloudInfo']);
    if (cloudInfo != null && cloudInfo !== '') {
      authUserUsed.current = true;

      let json1 = Utils.tryJsonParse(cloudInfo);
      if (json1 && json1.region && json1.cloud) {
        setUseCloudServiceSel(calcRegionFromString(json1.cloud) ?? EUploadCloudServiceType.AWS);
        setRegion(json1.region);
      }
    }
  }, [authUser]);

  const onFinishConfirm = () => {
    if (props.isFull) {
      StoreActions.getAuthUser_(() => {
        Location.push('/' + PartsLink.project_list);
      });
    } else {
      StoreActions.getAuthUser_(() => {
        setShowFormCC(false);

        incRefreshCards();
      });
    }
  };
  const doCloseConfirm = (isDone: boolean) => {
    // getConfirm?.destroy();
    // setConfirm(null);

    if (isDone) {
    }
  };
  const doShowForm = () => {
    setShowFormCC(true);
  };

  let doWorkCard = () => {
    if (Utils.isMobile() && props.isFull) {
      let authUser1 = calcAuthUserIsLoggedIn();
      if (authUser1?.canUse) {
        if (authUser1?.alreadyOrgId) {
          setIsProcessing(false);
          doShowForm();
          return;
        }
      } else {
        setTimeout(() => {
          setIsProcessing(true);
        }, 0);
      }
    }

    REClient_.client_()._selectOrganizationRegion(calcRegionString(useCloudServiceSel), region, (errR, resR) => {
      if (errR || !resR?.success) {
        setIsProcessing(false);
        REActions.addNotificationError(errR || Constants.errorDefault);
      } else {
        if (props.isFull) {
          REClient_.client_()._createBillingAccount((err, res) => {
            setIsProcessing(false);

            if (res?.alreadyDone) {
              doShowForm();
            } else if (err || !res.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              doShowForm();
            }
          });
        } else {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleSubmit = (values) => {
    setIsProcessing(true);

    let authUser1 = calcAuthUserIsLoggedIn();
    let alreadyInOrg = authUser1?.alreadyOrgId;

    if (!orgAlreadyCreated.current && !alreadyInOrg) {
      REClient_.client_().createOrganization(values.orgName, null, false, (errOrg, resOrg) => {
        if (errOrg || !resOrg) {
          setIsProcessing(false);
          REActions.addNotificationError(errOrg || Constants.errorDefault);
        } else {
          orgAlreadyCreated.current = true;
          doWorkCard();
        }
      });
    } else {
      doWorkCard();
    }
  };

  const onClickSkip = (e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    REClient_.client_()._createPlaceholderOrganization((errOrg, resOrg) => {
      let isAlready = resOrg?.alreadyInOrganization === true;

      if (!isAlready && (errOrg || !resOrg)) {
        setIsProcessing(false);
        REActions.addNotificationError(errOrg || Constants.errorDefault);
      } else {
        orgAlreadyCreated.current = true;
        doWorkCard();
      }
    });
  };

  const onClickAddCard = (e) => {
    doShowForm();
  };

  const calcRegionFromString = (service: string) => {
    let s1 = null;
    if (service === 'aws') {
      return EUploadCloudServiceType.AWS;
    } else if (service === 'gcp') {
      return EUploadCloudServiceType.GoogleCloud;
    } else if (service === 'azure') {
      return EUploadCloudServiceType.Azure;
    }
    return null;
  };

  const calcRegionString = (service: EUploadCloudServiceType) => {
    let s1 = null;
    if (service === EUploadCloudServiceType.AWS) {
      s1 = 'aws';
    } else if (service === EUploadCloudServiceType.GoogleCloud) {
      s1 = 'gcp';
    } else if (service === EUploadCloudServiceType.Azure) {
      s1 = 'azure';
    }
    return s1;
  };

  useEffect(() => {
    let s1 = calcRegionString(useCloudServiceSel);
    if (s1 != null) {
      REClient_.client_()._listRegions(s1, (err, res) => {
        if (!err && res?.result) {
          setRegions(res.result);
        }
      });
    }
  }, [useCloudServiceSel]);

  const optionsRegionRes: { list; defaultValue } = useMemo(() => {
    let defaultValue = null;
    let list = regions?.map((s1) => {
      let isSupported = s1.status === 'supported';

      if (isSupported) {
        if (s1.defaultRegion || defaultValue == null) {
          defaultValue = s1.region;
        }
      }

      let name1 = s1.region;
      if (!isSupported) {
        name1 += ' (Coming Soon)';
      }

      return { label: name1, value: s1.region, disabled: !isSupported };
    });
    return { list, defaultValue };
  }, [regions]);
  const [region, setRegion] = useState(null);

  let userOne = useMemo(() => {
    let res = calcAuthUserIsLoggedIn();
    if (res.isLoggedIn) {
      return authUser.get('data');
    }
  }, [authUser]);
  let orgName = useMemo(() => {
    let res = userOne?.getIn(['organization', 'name']);
    if (res != null) {
      return res;
    } else {
      let authUser = calcAuthUserIsLoggedIn();
      if (authUser?.alreadyOrgId) {
        return '-';
      }
    }
    return null;
  }, [userOne]);

  React.useEffect(() => {
    let optionsRegionSel = optionsRegionRes?.list?.find((o1) => o1.value === region);
    if (optionsRegionSel == null && optionsRegionRes?.list && optionsRegionRes?.list.length > 0) {
      let sel1 = optionsRegionRes.defaultValue;
      if (sel1) {
        if (optionsRegionRes?.list?.find((o1) => o1.value === region) == null) {
          if (region !== sel1) {
            setRegion(sel1);
          }
        }
        optionsRegionSel = optionsRegionRes?.list?.find((o1) => o1.value === sel1);
      }
    }
    form?.setFieldsValue({
      region: optionsRegionSel,
      orgName: orgName,
    });
  }, [optionsRegionRes, orgName]);
  const setUseCloudServiceSelExt = (v1) => {
    setRegions(null);
    setUseCloudServiceSel(v1);
  };

  let styleRoot: CSSProperties = {};
  if (props.isFull) {
    styleRoot = {
      margin: '30px auto',
      maxWidth: '920px',
    };
  }

  const formatterNum = new Intl.NumberFormat('en-US', {});
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const serviceIconSize = isMobile ? 34 : 46;

  const onClickCancelCard = (e) => {
    setShowFormCC(false);
  };

  const alreadySkipOrg = useRef(false);
  let skipAll = useMemo(() => {
    if (!Utils.isMobile()) {
      return false;
    }

    let authUser1 = calcAuthUserIsLoggedIn();
    if (authUser1?.canUse && authUser1?.isLoggedIn && !showFormCC && !orgAlreadyCreated.current) {
      if (props.isFull && orgName == null && !authUser1.alreadyOrgId) {
        if (!alreadySkipOrg.current) {
          if (!useCloudServiceSel || !region) {
            return true;
          }
        }

        if (!alreadySkipOrg.current) {
          onClickSkip(null);
        }
        alreadySkipOrg.current = true;

        return true;
      } else {
        if (!isProcessing && useCloudServiceSel && region) {
          if (!alreadySkipOrg.current) {
            doWorkCard();
          }
          alreadySkipOrg.current = true;
        }
      }
    }
  }, [authUser, orgName, useCloudServiceSel, region]);
  if (skipAll && !orgAlreadyCreated.current) {
    return <div></div>;
  }

  return (
    <div style={styleRoot}>
      <div style={{ margin: '0 30px' }}>
        <TopTitle>{props.isFull ? (Utils.isMobile() ? 'Finish Free Trial Set Up' : 'Finish Setting Up Account') : 'Billing'}</TopTitle>

        <div style={{ marginTop: '14px', paddingBottom: Utils.isMobile() ? '10px' : '30px', borderTop: '1px solid white' }} />

        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <RefreshAndProgress isRefreshing={isProcessing} isRelative>
              <div style={{ display: showFormCC ? 'none' : 'block' }}>
                <FormExt layout={'vertical'} form={form} onFinish={handleSubmit}>
                  <Form.Item style={{ display: 'none' }} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>SELECT A CLOUD PROVIDER:</span>}>
                    <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                      <div
                        style={styleRectType}
                        className={sd.rectSel + ' ' + (useCloudServiceSel === EUploadCloudServiceType.AWS ? sd.selected + ' ' + s.selected : '')}
                        onClick={() => setUseCloudServiceSelExt(EUploadCloudServiceType.AWS)}
                      >
                        <div className={s.checkSel}>
                          <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                        </div>
                        <div>
                          <div>
                            <img src={calcImgSrc('/imgs/cloudServiceAWS.png')} alt={''} style={{ width: serviceIconSize + 'px' }} />
                            <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>AWS</div>
                          </div>
                        </div>
                      </div>
                      <div
                        style={styleRectType}
                        className={sd.rectSel + ' ' + (useCloudServiceSel === EUploadCloudServiceType.GoogleCloud ? sd.selected + ' ' + s.selected : '')}
                        onClick={() => setUseCloudServiceSelExt(EUploadCloudServiceType.GoogleCloud)}
                      >
                        <div className={s.checkSel}>
                          <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                        </div>
                        <div>
                          <div>
                            <img src={calcImgSrc('/imgs/cloudServiceGC.png')} alt={''} style={{ width: serviceIconSize + 60 - 46 + 'px' }} />
                            <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>Google Cloud</div>
                          </div>
                        </div>
                      </div>
                      {false && (
                        <div
                          style={styleRectType}
                          className={sd.rectSel + ' ' + (useCloudServiceSel === EUploadCloudServiceType.Azure ? sd.selected + ' ' + s.selected : '')}
                          onClick={() => setUseCloudServiceSelExt(EUploadCloudServiceType.Azure)}
                        >
                          <div className={s.checkSel}>
                            <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                          </div>
                          <div>
                            <img src={calcImgSrc('/imgs/cloudServiceAzure.png')} alt={''} style={{ width: serviceIconSize + 88 - 46 + 'px' }} />
                            <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>Azure</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Form.Item>

                  <Form.Item style={{ display: 'none', marginTop: 0 }}>
                    <SelectARegion>SELECT A REGION:</SelectARegion>
                    <Form.Item name={'region'} rules={[{ required: true, message: 'Region Required' }]}>
                      <SelectExt
                        onChange={(option1) => {
                          setRegion(option1?.value);
                        }}
                        style={{ fontWeight: 400, color: Utils.colorA(1) }}
                        options={optionsRegionRes?.list}
                      />
                    </Form.Item>
                  </Form.Item>

                  {props.isFull && (
                    <Form.Item style={{ marginTop: 0 }}>
                      <SelectARegion>{orgName == null ? 'CREATE AN ORGANIZATION' : 'FOR THIS ORGANIZATION'}</SelectARegion>
                      <Form.Item
                        style={{ marginBottom: 0 }}
                        name={'orgName'}
                        hasFeedback
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(rule, value) {
                              if (false && getFieldValue('skipNameOrg')) {
                                return Promise.resolve();
                              } else {
                                if (Utils.isNullOrEmpty(value)) {
                                  return Promise.reject('Organization Name Required');
                                } else {
                                  return Promise.resolve();
                                }
                              }
                            },
                          }),
                        ]}
                      >
                        <Input placeholder={'e.g My Company'} disabled={orgName != null} />
                      </Form.Item>
                      <OrgName>Note: You will be able to invite an unlimited number of users to your organization.</OrgName>
                    </Form.Item>
                  )}

                  {props.isFull && (
                    <Form.Item style={{ marginBottom: '1px' }}>
                      <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '0 -22px' }}></div>
                      <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                          {props.isFull ? 'Finish Set-up' : 'Save Region'}
                        </Button>
                      </div>
                      {orgName == null && (
                        <div style={{ marginTop: '50px' }}>
                          <Button type={'default'} ghost onClick={onClickSkip} style={{ opacity: 0.8 }}>
                            Skip Step
                          </Button>
                        </div>
                      )}
                    </Form.Item>
                  )}
                </FormExt>

                {false && props.isFull && (
                  <div style={{ marginTop: '25px', textAlign: 'center' }}>
                    <Link to={'/sign_out'} noApp>
                      <span style={{ cursor: 'pointer' }} className={sd.styleTextBlue}>
                        Log out
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {showFormCC && (
                <div>
                  {/*// @ts-ignore*/}
                  {ProfileBillingWithStripeComponent && stripeAuthKey && !Constants.flags.onprem ? (
                    <Suspense fallback={<>Loading...</>}>
                      <ProfileBillingWithStripeComponent stripeAuthKey={stripeAuthKey} doCloseConfirm={doCloseConfirm} isFull onFinishConfirm={onFinishConfirm} />
                    </Suspense>
                  ) : null}

                  {!props.isFull && (
                    <div style={{ marginTop: '40px' }}>
                      <Button type={'default'} ghost style={{ width: '100%' }} onClick={onClickCancelCard}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </RefreshAndProgress>

            {!props.isFull && !showFormCC && (
              <div style={{ marginTop: '40px' }}>
                <BillingList refreshCardsId={refreshCards} />

                <div style={{ marginTop: '25px', textAlign: 'center' }}>
                  <Button type={'primary'} onClick={onClickAddCard}>
                    Add Card
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!isMobile && (
            <div style={{ flex: '0 0 357px', marginLeft: '64px' }}>
              <PriceTitle>Pricing</PriceTitle>
              <PriceContent>
                <SubTitle>Free Trial</SubTitle>
                <SubtitleDesc>With the free trial you can train models and generate Predictions for FREE!</SubtitleDesc>
                <PriceLine>
                  <PriceName>
                    Training:&nbsp;
                    <HelpIcon tooltipText={'1 training hour is the amount of compute required to train your model for an hour using a server with 2 2.5GHz CPUs and 0.5 GiB of memory.  Most models will be trained in under 3 hours.'} />
                  </PriceName>
                  <PriceValue>{ratesFree?.training == null ? '' : formatterNum.format(ratesFree?.training) + ' Training Hours FREE'}</PriceValue>
                </PriceLine>
                <PriceLine>
                  <PriceName>
                    Real-time Predictions:&nbsp;
                    <HelpIcon tooltipText={'This is the charge for your model deployments at a reserved capacity of 1 Queries Per Second (QPS) per hour'} />
                  </PriceName>
                  <PriceValue>{ratesFree?.training == null ? '' : formatterNum.format(ratesFree?.deployment) + ' QPS-Hours FREE'}</PriceValue>
                </PriceLine>
                <PriceLine>
                  <PriceName>
                    Batch Predictions:&nbsp;
                    <HelpIcon tooltipText={'Number of batch predictions generated'} />
                  </PriceName>
                  <PriceValue>{ratesFree?.batch == null ? '' : formatterNum.format(ratesFree?.batch) + ' Predictions FREE'}</PriceValue>
                </PriceLine>

                <div style={{ marginTop: '30px' }}></div>

                <SubTitle>Pay-per Use Pricing</SubTitle>
                <SubtitleDesc>After Free Trial credits are used, you will be charged pay-per-use. No upfront pricing.</SubtitleDesc>
                <PriceLine>
                  <PriceName>Training:</PriceName>
                  <PriceValue>{rates?.train?.base?.rate == null ? '' : formatter.format((rates?.train?.base?.rate ?? 0) / 100) + ' / ' + rates?.train?.base?.unit}</PriceValue>
                </PriceLine>
                <PriceLine>
                  <PriceName>Real-time Predictions:</PriceName>
                  <PriceValue>{rates?.inference?.qps?.rate == null ? '' : formatter.format((rates?.inference?.qps?.rate ?? 0) / 100) + ' / ' + rates?.inference?.qps?.unit}</PriceValue>
                </PriceLine>
                <PriceLine>
                  <PriceName>Batch Predictions:</PriceName>
                  <PriceValue>{rates?.batch?.predictions?.rate == null ? '' : formatter.format((rates?.batch?.predictions?.rate ?? 0) / 100) + ' / ' + rates?.batch?.predictions?.unit}</PriceValue>
                </PriceLine>

                <div style={{ borderTop: '1px solid ' + Utils.colorA(0.2), marginBottom: '12px' }}></div>

                <PriceLine>
                  <PriceName>SLA</PriceName>
                  <PriceValue>{Constants.flags.sla + ' uptime'}</PriceValue>
                </PriceLine>

                <Link newWindow to={'/' + PartsLink.price_lists}>
                  <PriceDesc>Learn more about our services and pricing</PriceDesc>
                </Link>
              </PriceContent>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProfileBilling;
