import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
import CopyText from '../CopyText/CopyText';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TextMax from '../TextMax/TextMax';
const s = require('./DocStoreRenderImage.module.css');
const sd = require('../antdUseDark.module.css');

export const DocStoreImageSizePxWW = 300;
export const DocStoreImageSizeZoomedPxWW = 900;

interface IDocStoreRenderImagePropsImg {
  src?: string;
  size?: number;
}

const DocStoreRenderImageImg = React.memo((props: PropsWithChildren<IDocStoreRenderImagePropsImg>) => {
  const [isLoadingImg, setIsLoadingImg] = useState(false);
  const [srcUsed, setSrcUsed] = useState(null);

  useEffect(() => {
    setIsLoadingImg(true);
    setSrcUsed(Constants.transparentPixelBase64);

    let src1 = props.src;
    if (Utils.isNullOrEmpty(src1)) {
      setIsLoadingImg(false);
    } else {
      setTimeout(() => {
        setSrcUsed(src1);
      }, 30);
    }
  }, [props.src]);

  return (
    <RefreshAndProgress
      isDim={isLoadingImg}
      isMsgAnimRefresh={isLoadingImg}
      msgMsg={
        isLoadingImg
          ? ((
              <span
                css={`
                  font-size: 1px;
                `}
              >
                &nbsp;
              </span>
            ) as any)
          : undefined
      }
      hideCircularImage
      msgTop={'45%'}
    >
      <div
        className={sd.absolute}
        css={`
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);

          &:hover {
            cursor: pointer;
            background: ${Constants.backBlueDark()};
          }
        `}
      >
        <img
          onError={(e) => {
            setSrcUsed((u1) => {
              if (u1 !== Constants.transparentPixelBase64) {
                setIsLoadingImg(false);
              }
              return u1;
            });
          }}
          onLoad={(e) => {
            setSrcUsed((u1) => {
              if (u1 !== Constants.transparentPixelBase64) {
                setIsLoadingImg(false);
              }
              return u1;
            });
          }}
          src={srcUsed}
          css={`
            flex-shrink: 0;
            max-width: ${props.size ?? 99999}px;
            max-height: ${props.size ?? 99999}px;
          `}
        />
      </div>
    </RefreshAndProgress>
  );
});

export const calcImageDocIdUrl = (docId?, ww?, hh?) => {
  if (docId == null || docId === '') {
    return null;
  } else {
    let maxWidthParam = ww ? `&maxWidth=${ww}` : '';
    let maxHeightParam = hh ? `&maxHeight=${hh}` : '';
    return `/api/v0/getDocstoreImage?docId=${encodeURIComponent(docId)}` + maxWidthParam + maxHeightParam;
  }
};

interface IDocStoreRenderImageProps {
  data?: any;
  cols?: string[];
  showBottomElem?: boolean;
  maxWW?: number;
  maxHH?: number;
  annotationsEditBaseLink?: string;
  rowId?: any;
  calcDocId?: (id?: any) => any;
}

const DocStoreRenderImage = React.memo((props: PropsWithChildren<IDocStoreRenderImageProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [src, setSrc] = useState(null);

  const colIMAGE = props.cols?.[0];

  const getDocId = () => {
    if (!props.data || _.isEmpty(props.data)) {
      return null;
    }
    if (_.isString(props.data)) {
      return props.data;
    } else {
      return props.data?.[colIMAGE];
    }
  };

  const getCalcDocId = () => {
    const docId = getDocId();
    if (props.calcDocId) {
      return props.calcDocId(docId);
    }
    return docId;
  };

  const getAnnotationsEditLink = () => {
    if (!props.annotationsEditBaseLink || _.isEmpty(props.annotationsEditBaseLink)) {
      return null;
    }
    const docId1 = getDocId();
    if (docId1 == null) {
      return null;
    }

    const rowId = props.rowId;
    if (typeof rowId === 'number' || typeof rowId === 'string') {
      return `${props.annotationsEditBaseLink}?rowId=${rowId}&docId=${docId1}`;
    }

    return `${props.annotationsEditBaseLink}?docId=${docId1}`;
  };

  useEffect(() => {
    if (!props.data || _.isEmpty(props.data)) {
      setSrc(null);
      return;
    }

    let docId1 = getCalcDocId();
    const ww = DocStoreImageSizePxWW;

    setSrc(calcImageDocIdUrl(docId1, props.maxWW ?? ww, props.maxHH ?? ww));
  }, [props.data, props.cols, colIMAGE]);

  const calcBottom = (data, cols, maxWidthUse = true) => {
    let label1 = data?.[cols?.[1]];
    if (Utils.isNullOrEmpty(label1)) {
      label1 = null;
    }
    let docId1 = data?.[cols?.[0]];
    if (Utils.isNullOrEmpty(docId1)) {
      docId1 = null;
    }

    return (
      <>
        {cols?.[1] != null && (
          <div
            css={`
              display: flex;
              align-items: center;
              flex-flow: wrap;
              margin: 8px 0 5px;
              justify-content: center;
            `}
          >
            <span
              css={`
                margin-right: 7px;
              `}
            >
              Label:
            </span>
            <span
              css={`
                opacity: 0.7;
              `}
            >
              {label1 == null ? '(None)' : label1}
            </span>
          </div>
        )}
        {cols?.[0] != null && (
          <div
            css={`
              display: flex;
              align-items: center;
              flex-flow: wrap;
              margin: 8px 0 5px;
              justify-content: center;
              ${!maxWidthUse ? `width: 100%;` : `width: ${props.maxWW ?? DocStoreImageSizePxWW - 2 * 20}px;`} margin: 0 auto;
            `}
          >
            <span
              css={`
                margin-right: 7px;
              `}
            >
              ID:
            </span>
            <span
              css={`
                opacity: 0.7;
              `}
            >
              {docId1 == null ? (
                '(None)'
              ) : (
                <span>
                  <TextMax max={60} style={{ whiteSpace: 'normal', textAlign: 'center' }}>
                    {docId1}
                  </TextMax>
                  <CopyText noText>{docId1}</CopyText>
                </span>
              )}
            </span>
          </div>
        )}
      </>
    );
  };

  const calcImage = (srcUsed, ww, showBottom = false) => {
    return (
      <div
        css={`
          width: ${ww}px;
          height: ${ww}px;
          position: relative;
        `}
      >
        {!Utils.isNullOrEmpty(src) && <DocStoreRenderImageImg src={srcUsed} size={ww} />}
        {showBottom && (
          <div
            css={`
              margin-top: 20px;
            `}
          >
            {calcBottom(props.data, props.cols, false)}
          </div>
        )}
      </div>
    );
  };

  const elem = useMemo(() => {
    const srcUsed = src ?? Constants.transparentPixelBase64;
    const annotationsEditLink = getAnnotationsEditLink();

    if (DocStoreImageSizeZoomedPxWW > (props.maxWW ?? DocStoreImageSizePxWW)) {
      setSrc(calcImageDocIdUrl(getCalcDocId(), DocStoreImageSizeZoomedPxWW, DocStoreImageSizeZoomedPxWW));
    }

    let elem1 = (
      <div css={``}>
        <div
          css={`
            padding-bottom: 10px;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          `}
        >
          Image Zoom
        </div>
        {annotationsEditLink && (
          <Link to={annotationsEditLink}>
            <Button ghost type={'default'}>
              Go to Annotations
            </Button>
          </Link>
        )}
        <div css={``}>{calcImage(srcUsed, DocStoreImageSizeZoomedPxWW, true)}</div>
      </div>
    );

    return (
      <ModalConfirm title={elem1} okText={'Close'} okType={'primary'} width={DocStoreImageSizeZoomedPxWW}>
        {calcImage(srcUsed, props.maxWW ?? DocStoreImageSizePxWW)}
      </ModalConfirm>
    );
  }, [src, props.data, props.cols, props.maxWW]);

  const elemBottom = useMemo(() => {
    return calcBottom(props.data, props.cols);
  }, [props.data, props.cols]);

  return (
    <div>
      {elem}
      {props.showBottomElem && elemBottom}
    </div>
  );
});

export default DocStoreRenderImage;
