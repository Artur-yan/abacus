import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import Utils, { calcImgSrc } from '../../../core/Utils';
import Constants from '../../constants/Constants';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./AskTypeAccess.module.css');
const sd = require('../antdUseDark.module.css');

interface IAskTypeAccessProps {}

const AskTypeAccess = React.memo((props: PropsWithChildren<IAskTypeAccessProps>) => {
  const isMobile = Utils.isMobile();
  const ww = isMobile ? 268 : 360;

  return (
    <div style={{}}>
      <div style={{ margin: isMobile ? '14px auto 14px auto' : '80px auto 60px auto', textAlign: 'center', fontFamily: 'Roboto', fontSize: isMobile ? '24px' : '40px', lineHeight: '1.24', letterSpacing: '0.05px', color: '#ffffff' }}>
        Try {Constants.flags.product_name} For Free
      </div>

      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'center' : 'flex-start', flexFlow: isMobile ? 'column' : 'row' }}>
        <span style={{ backgroundColor: 'white', borderRadius: '19px', width: ww + 'px', display: 'inline-block' }}>
          <span style={{ display: 'flex', flexFlow: 'column' }}>
            <img src={calcImgSrc('/imgs/typeAccess1.png')} alt={''} style={{ width: ww + 1 + 'px', marginLeft: '-1px' }} />
            <div
              style={{ margin: isMobile ? '12px 0 8px 0' : '24px 0 8px 0', fontFamily: 'Matter', fontSize: isMobile ? '14px' : '23px', fontWeight: 'bold', lineHeight: 1.53, letterSpacing: '0.03px', textAlign: 'center', color: '#23305e' }}
            >
              Self-Serve Cloud
            </div>
            <div style={{ minHeight: isMobile ? '' : '80px', padding: '0 10px', fontFamily: 'Roboto', fontSize: isMobile ? '12px' : '18px', lineHeight: 1.5, letterSpacing: '0.04px', textAlign: 'center', color: '#23305e' }}>
              Try our cloud AI service for free. Experience the magic of creating your custom deep learning system in hours
            </div>
            <div style={{ marginTop: isMobile ? '12px' : '44px', textAlign: 'center' }}>
              <Link to={'/' + PartsLink.signup}>
                <Button
                  style={{
                    fontFamily: 'Matter',
                    fontSize: isMobile ? '12px' : '18px',
                    fontWeight: 600,
                    letterSpacing: '0.36px',
                    color: '#ffffff',
                    width: ww - (isMobile ? 56 : 40) * 2 + 'px',
                    height: isMobile ? '26px' : '49px',
                    borderRadius: '32.5px',
                    backgroundColor: '#3391ed',
                  }}
                >
                  Sign Up For Free
                </Button>
              </Link>
              <div style={{ marginBottom: isMobile ? '18px' : '30px', textAlign: 'center', fontSize: '10px' }} className={sd.styleTextGray}>
                The process takes less than 2 minutes
              </div>
            </div>
          </span>
        </span>

        <div style={{ alignSelf: 'center', margin: '0 20px 0 20px', fontFamily: 'Matter', fontSize: isMobile ? '16px' : '24px', fontWeight: 600, letterSpacing: '0.02px', color: '#ffffff' }}>
          <span>OR</span>
        </div>

        <span style={{ backgroundColor: 'white', borderRadius: '19px', width: ww + 'px', display: 'inline-block' }}>
          <span style={{ display: 'flex', flexFlow: 'column' }}>
            <img src={calcImgSrc('/imgs/typeAccess2.png')} alt={''} style={{ width: ww + 'px' }} />
            <div
              style={{ margin: isMobile ? '12px 0 8px 0' : '24px 0 8px 0', fontFamily: 'Matter', fontSize: isMobile ? '14px' : '23px', fontWeight: 'bold', lineHeight: 1.53, letterSpacing: '0.03px', textAlign: 'center', color: '#23305e' }}
            >
              Schedule Free ML Consultation
            </div>
            <div style={{ minHeight: isMobile ? '' : '80px', padding: '0 10px', fontFamily: 'Roboto', fontSize: isMobile ? '12px' : '18px', lineHeight: 1.5, letterSpacing: '0.04px', textAlign: 'center', color: '#23305e' }}>
              One of our machine learning experts will call you.
            </div>
            <div style={{ marginTop: isMobile ? '12px' : '44px', textAlign: 'center' }}>
              <Link noApp to={'/?consaccess=1'}>
                <Button
                  style={{
                    fontFamily: 'Matter',
                    fontSize: isMobile ? '12px' : '18px',
                    fontWeight: 600,
                    letterSpacing: '0.36px',
                    color: '#ffffff',
                    width: ww - (isMobile ? 36 : 40) * 2 + 'px',
                    height: isMobile ? '26px' : '49px',
                    borderRadius: '32.5px',
                    backgroundColor: '#8c54ff',
                  }}
                >
                  Schedule Free Consultation
                </Button>
              </Link>
              <div style={{ marginBottom: isMobile ? '18px' : '30px', textAlign: 'center', fontSize: '10px' }} className={sd.styleTextGray}>
                &nbsp;
              </div>
            </div>
          </span>
        </span>
      </div>
    </div>
  );
});

export default AskTypeAccess;
