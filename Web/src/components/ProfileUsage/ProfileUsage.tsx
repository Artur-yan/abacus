import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import ObjectUsageList from '../ObjectUsageList/ObjectUsageList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';

const s = require('./ProfileUsage.module.css');
const sd = require('../antdUseDark.module.css');

const PriceTitle = styled.div`
  height: 59px;
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
  background-color: #0c121b;
  border-radius: 1px;
  padding: 21px 24px;
`;

const PriceName = styled.span`
  color: #8798ad;
  line-height: 1.38;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 600;
  height: 22px;
  width: 213px;
  display: inline-block;
`;

const PriceValue = styled.span`
  color: #ffffff;
  line-height: 1.38;
  font-size: 16px;
  font-family: Matter, sans-serif;
  font-weight: 400;
  height: 22px;
  width: 90px;
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
`;

const OrgName = styled.div`
  color: #b2c9da;
  letter-spacing: 1.12px;
  font-size: 12px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  line-height: 2;
`;

const AllBlack = styled.div`
  color: black !important;

  h1,
  h2,
  h3,
  h4 {
    color: black !important;
  }
`;

interface IProfileUsageProps {}

const ProfileUsage = React.memo((props: PropsWithChildren<IProfileUsageProps>) => {
  let styleRoot: CSSProperties = {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [usage, setUsage] = useState(null);
  const [nextBillDate, setNextBillDate] = useState(null);
  const [startBillDate, setStartBillDate] = useState(null);
  const [totals, setTotals] = useState(null);
  const [selOption, setOption] = useState('training');
  const [rates, setRates] = useState(null);

  const [viewDate, setViewDate] = useState(null as { month?: number; year?: number });

  const retrieveNextBillDate = () => {
    REClient_.client_()._getNextBillingDate((err, res) => {
      if (!err && res?.result) {
        let dt1 = moment(res?.result).utc();
        if (!dt1.isValid()) {
          dt1 = null;
        }
        setNextBillDate(dt1);
      } else {
        setNextBillDate(null);
      }
    });
  };
  useEffect(() => {
    retrieveNextBillDate();
  }, []);

  let fromDt = viewDate == null ? null : moment('' + viewDate.year + '-' + viewDate.month + '-1', 'yyyy-MM-dd').startOf('day');
  let toDt = fromDt == null ? null : moment(fromDt).endOf('month').endOf('day');

  const retrieveUsage = (viewDate) => {
    let fromDt = viewDate == null ? null : moment('' + viewDate.year + '-' + viewDate.month + '-1', 'yyyy-MM-dd').startOf('day');
    let toDt = fromDt == null ? null : moment(fromDt).endOf('month').endOf('day');

    setIsProcessing(true);
    REClient_.client_()._getCurrentUsage(fromDt == null ? undefined : fromDt.utcOffset(0, true).unix(), toDt == null ? undefined : toDt.utcOffset(0, true).unix() + 1, undefined, (err, res) => {
      setIsProcessing(false);
      if (!err && res?.result) {
        setUsage(res?.result);
        let dt1 = moment(res?.result?.start).utc();
        if (!dt1.isValid()) {
          dt1 = null;
        }
        setStartBillDate(dt1);
        setTotals(res?.result?.totals || {});
      } else {
        setUsage(null);
        setTotals({});
      }
    });

    REClient_.client_()._getRates((err, res) => {
      if (!err && res?.result) {
        setRates(res?.result ?? null);
      } else {
        Utils.error(err || 'Error');
        setRates(null);
      }
    });
  };

  useEffect(() => {
    retrieveUsage(viewDate);
  }, [viewDate]);

  const formatterNum = new Intl.NumberFormat('en-US', {});

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

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
    fontSize: '14px',
  };

  const creditCalc = (value, credit, rate, rateCount = 1) => {
    if (value == null || value <= 0) {
      return value;
    }

    let res = 0;
    if (credit != null) {
      credit = ((credit / rateCount) * (rate || 0)) / 100;

      if (credit > value) {
        res = value;
      } else {
        res = credit;
      }
    }
    return res;
  };
  const totalCalc = (value, credit, rate, rateCount = 1) => {
    let res = value;
    if (res == null) {
      res = 0;
    }

    credit = creditCalc(value, credit, rate, rateCount);
    res = res - credit;
    return res;
  };

  let creditsCalc = useMemo(() => {
    return {
      batch: creditCalc((totals?.batch || 0) / 100, usage?.credits?.batch || 0, rates?.batch?.predictions?.rate, 1000),
      inference: creditCalc((totals?.inference || 0) / 100, usage?.credits?.deployment || 0, rates?.inference?.qps?.rate),
      train: creditCalc((totals?.train || 0) / 100, usage?.credits?.training || 0, rates?.train?.base?.rate),
    };
  }, [totals, usage, rates]);

  let creditsAllZero = creditsCalc?.batch === 0 && creditsCalc?.inference === 0 && creditsCalc?.train === 0;

  let total1 = useMemo(() => {
    return (
      totalCalc((totals?.batch || 0) / 100, usage?.credits?.batch || 0, rates?.batch?.predictions?.rate, 1000) +
      totalCalc((totals?.inference || 0) / 100, usage?.credits?.deployment || 0, rates?.inference?.qps?.rate) +
      totalCalc((totals?.train || 0) / 100, usage?.credits?.training || 0, rates?.train?.base?.rate)
    );
  }, [totals, usage, rates]);

  let topTitle1 = startBillDate ? 'Usage Since ' + startBillDate.format('LL') : 'Current Usage';
  if (viewDate != null && fromDt != null && toDt != null) {
    topTitle1 = null;
  }

  const optionsMonth = useMemo(() => {
    let res = [
      // {
      //   label: 'Current',
      //   value: null,
      // }
    ];

    let year = moment().year();
    let month = moment().month() + 1;

    // month--;
    // if (month < 1) {
    //   month = 12;
    //   year--;
    // }

    //
    let orgCreatedAt = calcAuthUserIsLoggedIn()?.orgCreatedAt;
    if (!Utils.isNullOrEmpty(orgCreatedAt)) {
      let dtStart = moment(orgCreatedAt).startOf('month').startOf('day');

      let isFirst = true;
      let max = 200;
      while (
        moment('' + year + '-' + month + '-1', 'yyyy-MM-dd')
          .startOf('day')
          .isSameOrAfter(dtStart) &&
        max > 0
      ) {
        max--;

        let v1 = '' + year + '-' + (month < 10 ? '0' : '') + month;
        res.push({
          label: isFirst ? 'Current' : v1,
          value: v1,
        });

        isFirst = false;

        month--;
        if (month < 1) {
          month = 12;
          year--;
        }
      }
    }

    return res;
  }, [viewDate, calcAuthUserIsLoggedIn()?.orgCreatedAt]);

  let v1s = 'View Older Date',
    v1s2 = '';
  if (viewDate != null) {
    v1s = '' + viewDate.year + '-' + (viewDate.month < 10 ? '0' : '') + viewDate.month;
    v1s2 = v1s;
  }
  let optionsMonthSel = optionsMonth?.find((v1) => v1.value === v1s2) ?? { label: v1s, value: v1s2 };
  let popupContainerForMenu = (node) => document.getElementById('body2');

  const onChangeMonth = (option1) => {
    let s1 = option1?.value;

    if (s1 == null) {
      setViewDate(undefined);
    } else {
      const ss = s1.split('-');
      const year = Utils.tryParseInt(ss[0]);
      const month = Utils.tryParseInt(ss[1]);
      setViewDate({ month, year });
    }
  };

  return (
    <div style={styleRoot}>
      <div style={{ margin: '0 30px' }}>
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <TopTitle>{topTitle1 ?? 'Usage for'}</TopTitle>
          {topTitle1 != null && (
            <span
              css={`
                margin: 0 10px;
              `}
            >
              -
            </span>
          )}
          <span
            css={`
              width: 180px;
              display: inline-block;
              font-size: 14px;
              margin-left: ${viewDate == null ? 0 : 10}px;
            `}
          >
            <SelectExt value={optionsMonthSel} options={optionsMonth} onChange={onChangeMonth} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
          </span>
        </div>
        <div style={{ marginTop: '14px', paddingBottom: '30px', borderTop: '1px solid white' }} />
        <div style={{ display: 'flex', flexFlow: 'nowrap row', width: '400px' }}>
          <div
            style={styleRectType}
            className={sd.rectSel + ' ' + (selOption === 'training' ? sd.selected + ' ' + s.selected : '')}
            onClick={() => {
              setOption('training');
            }}
          >
            <div className={s.checkSel}>
              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
            </div>
            Training
          </div>
          <div
            style={styleRectType}
            className={sd.rectSel + ' ' + (selOption === 'deployments' ? sd.selected + ' ' + s.selected : '')}
            onClick={() => {
              setOption('deployments');
            }}
          >
            <div className={s.checkSel}>
              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
            </div>
            Real-Time Predictions
          </div>
          <div
            style={styleRectType}
            className={sd.rectSel + ' ' + (selOption === 'batch' ? sd.selected + ' ' + s.selected : '')}
            onClick={() => {
              setOption('batch');
            }}
          >
            <div className={s.checkSel}>
              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
            </div>
            Batch Predictions
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex' }}>
          <ObjectUsageList type={selOption} usageList={selOption == 'training' ? usage?.training : selOption == 'deployments' ? usage?.deployments : usage?.batch} />
          <div style={{ flex: '0 0 367px', marginLeft: '64px' }}>
            <RefreshAndProgress isRelative isRefreshing={isProcessing}>
              <PriceTitle>Totals</PriceTitle>
              <PriceContent>
                <PriceLine>
                  <PriceName>
                    <span style={{ color: Utils.colorA(0.8) }}>{viewDate == null ? 'Next Billing Date' : 'Bill For Date'}</span>
                  </PriceName>
                  <PriceValue>{viewDate != null ? fromDt?.format('YYYY-MM') : nextBillDate ? nextBillDate.format('LL') : 'N/A'}</PriceValue>
                </PriceLine>
                <PriceLine>
                  <PriceName>Training</PriceName>
                  <PriceValue>{formatter.format((totals?.train || 0) / 100)}</PriceValue>
                </PriceLine>
                {!creditsAllZero && (
                  <PriceLine>
                    <PriceName>Training Credits</PriceName>
                    <PriceValue>{formatter.format(-(creditsCalc?.train || 0))}</PriceValue>
                  </PriceLine>
                )}
                <div
                  css={`
                    height: 10px;
                  `}
                ></div>
                <PriceLine>
                  <PriceName>Real-Time Predictions</PriceName>
                  <PriceValue>{formatter.format((totals?.inference || 0) / 100)}</PriceValue>
                </PriceLine>
                {!creditsAllZero && (
                  <PriceLine>
                    <PriceName>Real-Time Pred. Credits</PriceName>
                    <PriceValue>{formatter.format(-(creditsCalc?.inference || 0))}</PriceValue>
                  </PriceLine>
                )}
                <div
                  css={`
                    height: 10px;
                  `}
                ></div>

                <PriceLine>
                  <PriceName>Batch Predictions</PriceName>
                  <PriceValue>{formatter.format((totals?.batch || 0) / 100)}</PriceValue>
                </PriceLine>
                {!creditsAllZero && (
                  <PriceLine>
                    <PriceName>Batch Pred. Credits</PriceName>
                    <PriceValue>{formatter.format(-(creditsCalc?.batch || 0))}</PriceValue>
                  </PriceLine>
                )}

                <div
                  css={`
                    height: 10px;
                  `}
                ></div>
                <PriceLine>
                  <PriceName>
                    <span style={{ color: Utils.colorA(0.8) }}>Total</span>
                  </PriceName>
                  <PriceValue>{formatter.format(total1)}</PriceValue>
                </PriceLine>

                {usage?.credits != null && !_.isEmpty(usage?.credits) && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ borderTop: '1px solid ' + Utils.colorA(0.2), marginBottom: '25px' }}></div>

                    <div style={{ margin: '8px 0' }}>
                      <PriceName>
                        <span style={{ color: Utils.colorA(0.8) }}>Credits</span>
                      </PriceName>
                    </div>

                    <PriceLine>
                      <PriceName>Training</PriceName>
                      <PriceValue>{formatterNum.format(usage?.credits?.training ?? 0)}</PriceValue>
                    </PriceLine>
                    <PriceLine>
                      <PriceName>Real-Time Predictions</PriceName>
                      <PriceValue>{formatterNum.format(usage?.credits?.deployment ?? 0)}</PriceValue>
                    </PriceLine>
                    <PriceLine>
                      <PriceName>Batch Predictions</PriceName>
                      <PriceValue>{formatterNum.format(usage?.credits?.batch ?? 0)}</PriceValue>
                    </PriceLine>
                  </div>
                )}
              </PriceContent>
            </RefreshAndProgress>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileUsage;
