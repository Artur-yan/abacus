import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import UtilsWeb from '../../../core/UtilsWeb';
import Upload from 'antd/lib/upload';
import * as React from 'react';
import { PropsWithChildren } from 'react';

interface IUploadImageBoxProps {
  name?: string;
  onChangeImage?: (blob, base64) => void;
  dark?: boolean;
  width?: string | number;
  height?: string | number;
}

const styles = require('./UploadImageBox.module.css');
const ImageTypes = ['image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];

const UploadImageBox = React.memo(
  React.forwardRef((props: PropsWithChildren<IUploadImageBoxProps>, ref: any) => {
    const [imgPreviewBase64, setImgPreviewBase64] = React.useState(null);
    const [uploadFileData, setUploadFileData] = React.useState(null);

    const onChangeFileList = (info) => {
      // console.log(info.file, info.fileList);

      UtilsWeb.blobToBase64(info.file)
        .then((res) => {
          props.onChangeImage(info.file, res);
        })
        .catch((err) => {
          //
        });
    };

    const onDrop = (e) => {
      // console.log("Dropped files", e.dataTransfer.files);
    };

    const selectedUploadFileData = (file) => {
      setImgPreviewBase64(null);

      const isImageFile = ImageTypes.includes(file.type);
      if (!isImageFile) {
        setUploadFileData(null);

        return Upload.LIST_IGNORE;
      }

      setUploadFileData(file);

      UtilsWeb.blobToBase64(file)
        .then((res) => {
          setImgPreviewBase64(res);
        })
        .catch((err) => {
          //
        });

      return false;
    };

    const onRemove = (e) => {
      e.stopPropagation();

      setUploadFileData(null);
      setImgPreviewBase64(null);

      props.onChangeImage(null, null);
    };

    return (
      <div style={{ display: 'inline-block', width: props.width, height: props.height }}>
        <Upload.Dragger multiple={false} showUploadList={false} onChange={onChangeFileList} onDrop={onDrop} beforeUpload={selectedUploadFileData} className={props.dark ? styles.dropper : ''}>
          {imgPreviewBase64 != null ? (
            <div style={{ width: '100%', height: '100%', textAlign: 'right' }}>
              <img
                src={imgPreviewBase64}
                width={props.width + 'px'}
                height={props.height + 'px'}
                style={{ position: 'absolute', left: 0, top: 0, objectFit: 'contain' }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
              <UploadOutlined style={{ marginRight: '20px', textAlign: 'right', zIndex: 10, position: 'relative', fontSize: '21px', color: props.dark ? 'white' : 'black' }} />
              <CloseCircleOutlined style={{ marginRight: '20px', textAlign: 'right', zIndex: 10, position: 'relative', fontSize: '21px', color: props.dark ? 'white' : 'black' }} onClick={onRemove} />
            </div>
          ) : (
            <div>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text" style={{ color: props.dark ? 'white' : 'black' }}>
                Click or drag image file to this area to upload
              </p>
            </div>
          )}
        </Upload.Dragger>
      </div>
    );
  }),
);

export default UploadImageBox;
