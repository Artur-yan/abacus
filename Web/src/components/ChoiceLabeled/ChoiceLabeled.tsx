import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { calcImgSrc } from '../../../core/Utils';
const s = require('./ChoiceLabeled.module.css');
const sd = require('../antdUseDark.module.css');

interface IChoiceLabeledProps {}

const Or = styled.div`
  color: #ffffff;
  letter-spacing: 1.12px;
  font-size: 12px;
  font-family: Matter, sans-serif;
  font-weight: 600;
`;
const Text1 = styled.div`
  color: #ffffff;
  line-height: 1.5;
  font-size: 16px;
  font-family: MatterSQ, sans-serif;
  font-weight: 700;
`;
const Text2 = styled.div`
  color: #ffffff;
  line-height: 1.71;
  font-size: 14px;
  font-family: Matter, sans-serif;
  font-weight: 500;
`;
const Title = styled.div`
  color: #ffffff;
  line-height: 1.33;
  font-size: 24px;
  font-family: Matter, sans-serif;
  font-weight: 400;
`;

const ChoiceLabeled = React.memo((props: PropsWithChildren<IChoiceLabeledProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isLabeled, setIsLabeled] = useState(true);

  const styleRectType: CSSProperties = {
    position: 'relative',
    backgroundColor: '#19232f',
    padding: '24px 20px',
    flex: 1,
    color: 'white',
    lineHeight: '1.2rem',
    textAlign: 'center',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ margin: '0 20px', paddingTop: '24px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <Title>Is your Data Labeled?</Title>
        <div style={{ marginTop: '14px', paddingBottom: '30px', borderTop: '1px solid white' }} />

        <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
          <div style={styleRectType} className={sd.rectSel + ' ' + (isLabeled ? sd.selected + ' ' + s.selected : '')} onClick={(e) => setIsLabeled(true)}>
            <div className={s.checkSel}>
              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
            </div>
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', height: '100%' }}>
              <div style={{ flex: '0 0 60px' }}>
                <img src={calcImgSrc('/imgs/labeledIcon.png')} alt={''} style={{ width: '40px' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left', padding: '0 14px 0 14px' }}>
                <Text1>Labeled</Text1>
                <Text2>My data contains examples of account fraud (Supervised Learning)</Text2>
              </div>
            </div>
          </div>
          <div style={{ marginRight: '22px', marginLeft: '22px', display: 'flex', alignItems: 'center' }}>
            <Or>OR</Or>
          </div>
          <div style={styleRectType} className={sd.rectSel + ' ' + (!isLabeled ? sd.selected + ' ' + s.selected : '')} onClick={(e) => setIsLabeled(false)}>
            <div className={s.checkSel}>
              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
            </div>
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', height: '100%' }}>
              <div style={{ flex: '0 0 60px' }}>
                <img src={calcImgSrc('/imgs/unlabeledIcon.png')} alt={''} style={{ width: '40px' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left', padding: '0 14px 0 14px' }}>
                <Text1>Unlabeled</Text1>
                <Text2>I have a log of activity but I don’t know which records are fraudulent? (Un-Supervised Learning)</Text2>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '55px' }}>
          <Button type={'primary'} style={{ width: '416px' }}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ChoiceLabeled;
