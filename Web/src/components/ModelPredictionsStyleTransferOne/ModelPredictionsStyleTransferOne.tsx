import Button from 'antd/lib/button';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import UploadImageBox from '../UploadImageBox/UploadImageBox';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import NanoScroller from '../NanoScroller/NanoScroller';
import REClient_ from '../../api/REClient';
import REActions from '../../actions/REActions';

interface IModelPredictionsStyleTransferOneProps {
  deploymentId?: string;
}

const s = require('./ModelPredictionsStyleTransferOne.module.css');

const ModelPredictionsStyleTransferOne = React.memo(
  React.forwardRef((props: PropsWithChildren<IModelPredictionsStyleTransferOneProps>, ref: any) => {
    const [subjectImg, setSubjectImg] = React.useState(null);
    const [styleImg, setStyleImg] = React.useState(null);
    const [resultImg, setResultImg] = React.useState(null);
    const [isRefresh, setIsRefresh] = React.useState(false);

    const onChangeSubjectImage = (blob, base64) => {
      setSubjectImg(blob);
    };

    const onChangeStyleImage = (blob, base64) => {
      setStyleImg(blob);
    };

    const onGenerate = (e) => {
      if (props.deploymentId) {
        setResultImg(null);
        setIsRefresh(true);

        REClient_.client_()._transferStyle(props.deploymentId, subjectImg, styleImg, (err, res) => {
          setIsRefresh(false);

          if (err || !res?.success || !res?.result || res?.result?.length < 1024) {
            REActions.addNotificationError('Style transfer failed. Please make sure faces are centered and occupy most of the image.');
            setResultImg(null);
          } else {
            let resString = 'data:image/jpeg;base64,' + res?.result;
            setResultImg(resString);
          }
        });
      }
    };

    return (
      <NanoScroller>
        <div css={'padding: 20px'}>
          <div css={'display: flex; gap: 50px; justify-content: center;'}>
            <div>
              <div css={'margin: 10px'}>Subject</div>
              <UploadImageBox dark width={400} height={400} onChangeImage={onChangeSubjectImage} />
            </div>
            <div>
              <div css={'margin: 10px'}>Style</div>
              <UploadImageBox dark width={400} height={400} onChangeImage={onChangeStyleImage} />
            </div>
          </div>
          <div css={'display: flex; gap: 50px; margin-top: 30px; justify-content: center; align-items: center;'}>
            <Button disabled={!subjectImg || !styleImg || isRefresh} type="primary" onClick={onGenerate}>
              Generate
            </Button>
            <div>
              <div css={'margin: 10px'}>Output</div>
              <div style={{ display: 'inline-block', position: 'relative', width: 400, height: 400, textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.35)' }}>
                {resultImg && <img src={resultImg} alt="" width={'100%'} height={'100%'} style={{ position: 'absolute', left: 0, top: 0, objectFit: 'contain' }} />}
                {resultImg && (
                  <a className={s.hide} download="_transferStyle.jpg" href={resultImg}>
                    <DownloadOutlined style={{ zIndex: 10, position: 'relative', fontSize: '21px', margin: '20px', color: 'white' }} />
                  </a>
                )}
                {isRefresh && <div style={{ width: '100%', height: '100%', zIndex: 10, position: 'absolute', left: 0, top: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>Generating...</div>}
              </div>
            </div>
          </div>
        </div>
      </NanoScroller>
    );
  }),
);

export default ModelPredictionsStyleTransferOne;
