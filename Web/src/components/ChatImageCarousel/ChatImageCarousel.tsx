import LeftOutlined from '@ant-design/icons/LeftOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import { Carousel } from 'antd';
import classNames from 'classnames';
import * as React from 'react';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const styles = require('./ChatImageCarousel.module.css');
const stylesDark = require('../antdUseDark.module.css');

const previewImageWidth = 200;
const modalImageWidth = 720;

const getImageUrl = (docId: string, maxWidth?: number, maxHeight?: number) => {
  if (Utils.isNullOrEmpty(docId)) return null;
  let maxWidthParam = maxWidth ? `&maxWidth=${maxWidth}` : '';
  let maxHeightParam = maxHeight ? `&maxHeight=${maxHeight}` : '';
  return `/api/v0/getDocstoreImage?docId=${encodeURIComponent(docId)}${maxWidthParam}${maxHeightParam}`;
};

interface ContentProps {
  initialSlideIndex: number;
  finlaSlideIndex: number;
}

const Content = React.memo((props: PropsWithChildren<ContentProps>) => {
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(props?.initialSlideIndex);

  React.useEffect(() => {
    setCurrentSlideIndex(props.initialSlideIndex);
  }, [props.initialSlideIndex]);

  return (
    <div className={classNames(styles.carouselContainer, styles.modalContainer)}>
      <div className={styles.modalTitle}>Image Zoom</div>
      <Carousel
        infinite={false}
        beforeChange={(_, index) => setCurrentSlideIndex(index)}
        initialSlide={currentSlideIndex}
        arrows
        prevArrow={currentSlideIndex ? <LeftOutlined /> : <div />}
        nextArrow={currentSlideIndex === props.finlaSlideIndex ? <div /> : <RightOutlined />}
        dotPosition="bottom"
        speed={160}
        easing="ease-out"
      >
        {props.children}
      </Carousel>
    </div>
  );
});

interface ChatImageProps {
  src?: string;
  size?: number;
  highlightedBoxes: any[];
}

const ChatImage = React.memo((props: PropsWithChildren<ChatImageProps>) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [src, setSrc] = useState(null);
  const [scale, setScale] = useState(1);

  const ref: any = useRef();

  useEffect(() => {
    setIsImageLoading(true);
    setSrc(Constants.transparentPixelBase64);

    if (Utils.isNullOrEmpty(props.src)) {
      setIsImageLoading(false);
    } else {
      setTimeout(() => {
        setSrc(props.src);
      }, 32);
    }
  }, [props.src]);

  const onErrorAndOnLoad = () => {
    const naturalWidth = ref?.current?.naturalWidth || 1;
    const width = ref?.current?.clientWidth || naturalWidth;
    setScale(width / naturalWidth);

    setSrc((currentSrc: string) => {
      if (currentSrc !== Constants.transparentPixelBase64) {
        setIsImageLoading(false);
      }
      return currentSrc;
    });
  };

  const highlightedBoxes = props?.highlightedBoxes?.map?.((highlightedBox) => {
    return highlightedBox?.map?.((coordinate) => coordinate * scale);
  });

  return (
    <RefreshAndProgress
      isDim={isImageLoading}
      isMsgAnimRefresh={isImageLoading}
      hideCircularImage
      msgTop={'45%'}
      msgMsg={
        isImageLoading
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
    >
      <div className={classNames(styles.chatImageContainer)}>
        <div className={classNames(styles.imageWrapper)}>
          <img
            ref={ref}
            src={src}
            css={`
              max-width: ${props.size}px;
              max-height: ${props.size}px;
            `}
            onError={onErrorAndOnLoad}
            onLoad={onErrorAndOnLoad}
          />
          {isImageLoading
            ? null
            : highlightedBoxes.map((highlightedBox) => {
                const left = highlightedBox[0] - 1; // add 1 px padding
                const top = highlightedBox[1] - 1; // add 1 px padding
                const width = Math.max(highlightedBox[2] - highlightedBox[0] + 2, 1); // +2 for 1 px padding on both ends
                const height = Math.max(highlightedBox[3] - highlightedBox[1] + 2, 1); // +2 for 1 px padding on both ends
                return <div className={styles.highlightedBox} style={{ left, top, width, height }} />;
              })}
        </div>
      </div>
    </RefreshAndProgress>
  );
});

const getImage = (src: string, width: number, highlightedBoxes: number[]) => {
  return (
    <div
      css={`
        width: ${width + 32}px;
        height: ${width}px;
        position: relative;
      `}
    >
      {!Utils.isNullOrEmpty(src) && <ChatImage src={src} size={width} highlightedBoxes={highlightedBoxes} />}
    </div>
  );
};

interface ChatImageCarouselProps {
  docIds: string[];
  boundingBoxes: any[];
}

const ChatImageCarousel = React.memo((props: PropsWithChildren<ChatImageCarouselProps>) => {
  const [images, setImages] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  useEffect(() => {
    if (!props?.docIds?.length) return;
    setImages(
      props?.docIds?.map((docId, index) => {
        const highlightedBoxes = props?.boundingBoxes?.[index] || [];
        return {
          // TODO: add back preview images with smaller dimesions
          // preview: getImageUrl(docId, previewImageWidth, previewImageWidth),
          // modal: getImageUrl(docId, modalImageWidth, modalImageWidth),
          base: getImageUrl(docId),
          highlightedBoxes,
        };
      }),
    );
  }, [props.docIds, props?.boundingBoxes]);

  return (
    <div className={styles.carouselContainer}>
      <Carousel
        infinite={false}
        beforeChange={(_, index) => setCurrentSlideIndex(index)}
        arrows
        prevArrow={currentSlideIndex ? <LeftOutlined /> : <div />}
        nextArrow={currentSlideIndex === images?.length - 1 ? <div /> : <RightOutlined />}
        dotPosition="bottom"
        speed={160}
        easing="ease-out"
      >
        {images?.map((image, index) => {
          // TODO: replace base image with preview image
          const previewSrc = image?.base ?? Constants.transparentPixelBase64;
          const highlightedBoxes = image?.highlightedBoxes ?? [];

          const title = (
            <Content initialSlideIndex={currentSlideIndex} finlaSlideIndex={images?.length - 1}>
              {images?.map((image, innerIndex) => {
                const modalSrc = image?.base ?? Constants.transparentPixelBase64;
                const highlightedBoxes = image?.highlightedBoxes ?? [];
                return <div key={`modal-carousel-${innerIndex}`}>{getImage(modalSrc, modalImageWidth, highlightedBoxes)}</div>;
              })}
            </Content>
          );
          return (
            <ModalConfirm key={`carousel-${index}`} title={title} okText={'Close'} okType={'primary'} width={modalImageWidth + 96}>
              {getImage(previewSrc, previewImageWidth, highlightedBoxes)}
            </ModalConfirm>
          );
        })}
      </Carousel>
    </div>
  );
});

export default ChatImageCarousel;
