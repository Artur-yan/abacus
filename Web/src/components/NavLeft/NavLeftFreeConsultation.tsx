import { Input, Button } from 'antd';
import confirm from 'antd/es/modal/confirm';
import * as React from 'react';
import { calcImgSrc } from '../../../core/Utils';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import StoreActions from '../../stores/actions/StoreActions';
import REClient_ from '../../api/REClient';
import REActions from '../../actions/REActions';

export const NavLeftFreeConsultation = React.memo(function NavLeftFreeConsultation() {
  const [requestHelpDesc, setRequestHelpDesc] = React.useState('');

  return (
    <div style={{ margin: '10px 8px' }}>
      <div
        css={`
          position: relative;
        `}
        style={{ borderRadius: '8px', backgroundColor: 'rgba(11,18,27,0.17)', padding: '15px 16px', textAlign: 'center' }}
      >
        <div
          onClick={() => {
            StoreActions.updateUserPreferences_({ usedFreeConsultation: true });
          }}
          css={`
            cursor: pointer !important;
            &:hover {
              background: rgba(44, 60, 82, 0.57);
            }
            background: rgba(11, 18, 27, 0.57);
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            right: -4px;
            top: -4px;
            width: 50px;
            height: 22px;
            color: white;
            border-radius: 14px;
            font-size: 12px;
            padding-bottom: 1px;
          `}
        >
          Hide
        </div>
        <div>
          <img src={calcImgSrc('/imgs/calendar.png')} alt={''} style={{ opacity: 0.8, width: '22px' }} />
        </div>
        <div style={{ marginTop: '10px', fontFamily: 'Matter', fontSize: '12px', fontWeight: 500, lineHeight: 1.36, color: '#ffffff', opacity: 0.8 }}>Schedule free consultation with our experts</div>
        <div style={{ marginTop: '12px', opacity: 0.7 }}>
          <ModalConfirm
            title={
              <div>
                <div
                  css={`
                    color: white;
                    margin-bottom: 10px;
                    text-align: center;
                  `}
                >
                  Schedule free consultation with our experts
                </div>
                <div
                  css={`
                    margin-bottom: 16px;
                    text-align: center;
                    font-size: 14px;
                  `}
                >
                  Describe the use-case you need help on?
                </div>
                <div>
                  <Input.TextArea
                    defaultValue={''}
                    style={{ height: '90px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
                    onChange={(e) => {
                      setRequestHelpDesc(e.target.value);
                    }}
                  />
                </div>
              </div>
            }
            onConfirm={() => {
              REClient_.client_()._requestHelp(requestHelpDesc, (err, res) => {
                if (err) {
                  REActions.addNotificationError(err);
                } else {
                  StoreActions.updateUserPreferences_({ usedFreeConsultation: true });

                  confirm({
                    content: 'Our specialists will reach out',
                    okText: 'Ok',
                    cancelButtonProps: { style: { display: 'none' } },
                  });
                }
              });
            }}
            okText={'Submit'}
            onClick={() => {
              setRequestHelpDesc('');
            }}
            cancelText={'Cancel'}
            okType={'primary'}
          >
            <Button type={'default'} ghost style={{ fontSize: '12px', padding: '0 9px' }}>
              Apply Now
            </Button>
          </ModalConfirm>
        </div>
      </div>
    </div>
  );
});
