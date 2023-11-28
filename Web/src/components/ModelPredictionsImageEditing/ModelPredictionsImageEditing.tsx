import { LoadingOutlined } from '@ant-design/icons';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import { Spin } from 'antd';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import NanoScroller from '../NanoScroller/NanoScroller';
import UploadImageBox from '../UploadImageBox/UploadImageBox';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface ModelPredictionsImageEditingProps {
  deploymentId?: string;
}

const styles = require('./ModelPredictionsImageEditing.module.css');

const ModelPredictionsImageEditing = React.memo((props: PropsWithChildren<ModelPredictionsImageEditingProps>) => {
  const [referenceImage, setReferenceImage] = React.useState(null);
  const [modifiedImage, setModifiedImage] = React.useState(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [queryString, setQueryString] = React.useState('');

  const onChangeReferenceImage = (blob) => setReferenceImage(blob);
  const onQueryChange = (e) => setQueryString(e.target.value);

  const onGenerateClick = async () => {
    if (!props.deploymentId) {
      return;
    }
    setModifiedImage(null);
    setIsRefreshing(true);
    try {
      const queryData = JSON.stringify({ prompt: queryString });
      const response: any = await REClient_.promises_()._modifyImageUsingText(props.deploymentId, queryData, referenceImage);
      if (!response?.success || response?.error || !response?.result?.length || response?.result?.length < 1024) {
        throw new Error(response?.error);
      }
      setModifiedImage(`data:image/jpeg;base64,${response?.result}`);
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
    setIsRefreshing(false);
  };

  const isGenerateButtonDisabled = !referenceImage || !queryString || isRefreshing;
  return (
    <NanoScroller>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.imageContainer}>
            <div className={styles.imageTitle}>Reference Image</div>
            <UploadImageBox dark width={480} height={480} onChangeImage={onChangeReferenceImage} />
          </div>
          <div className={styles.imageContainer}>
            <div className={styles.imageTitle}>Modified Image</div>
            <div className={styles.modifiedImageContainer}>
              {modifiedImage && (
                <>
                  <img className={styles.modifiedImage} src={modifiedImage} alt="" width="100%" height="100%" />
                  <a className={styles.hide} download="_modifiedImage.jpg" href={modifiedImage}>
                    <DownloadOutlined className={styles.downloadOutlined} />
                  </a>
                </>
              )}
              {isRefreshing && (
                <div className={styles.generatingMessage}>
                  <Spin indicator={antIcon} className={styles.spinner} />
                  Generating...
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.textButtonContainer}>
          <Input.TextArea className={styles.queryInput} onChange={onQueryChange} />
          <Button type="primary" disabled={isGenerateButtonDisabled} onClick={onGenerateClick}>
            Generate
          </Button>
        </div>
      </section>
    </NanoScroller>
  );
});

export default ModelPredictionsImageEditing;
