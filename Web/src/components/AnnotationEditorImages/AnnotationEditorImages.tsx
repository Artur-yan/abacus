import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import Input from 'antd/lib/input';
import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils from '../../../core/Utils';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import { calcImageDocIdUrl } from '../DocStoreRenderImage/DocStoreRenderImage';
import ModalContent from '../ModalContent/ModalContent';
import TooltipExt from '../TooltipExt/TooltipExt';
import { IPageToken, calcRectOverlap } from './CalcRectOverlap';
const styles = require('./AnnotationEditorImages.module.css');
const sd = require('../antdUseDark.module.css');

const allowEdit = false;

export interface IAnnotationEditorImageOne {
  annotations?: {
    id?: any;
    text?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }[];
}

interface IResponsePageOne {
  filename: string;
  pages: number;
  page: number;
  content: string;
}

export interface ISelRect {
  x?;
  y?;
  width?;
  height?;

  scaleUse?: number;

  label?: string;
  overlapSelRects?: string[];
  value?: string;

  maxProbability?: number;
  minProbability?: number;
  meanProbability?: number;

  lastMoveX?;
  lastMoveY?;

  entityId?: number;

  forcePageNumber?: number;
}

export interface IDataPdf {
  filename?;
  page?;
  totalPages?;
  docId?;
}

interface IAnnotationEditorImagesProps {
  docId?: string;
  data?: IDataPdf;
  onIsProcessingOCR?: (isProcessingOCR?: boolean) => void;
  onIsLoadingImage?: (isLoadingImage?: boolean) => void;
  onChangeAnnotations?: (list?: ISelRect[]) => void;
  selRectListOri?: ISelRect[];
  onNeedCurrentLabel?: () => Promise<string>;
  onMouseEnterLabel?: (value, e) => void;
  extractedFeatures?: any;
  readonly?: boolean;
  pageNumber?: number;
  showReviewNotStartedWarning?: boolean;
}

const imgBase64Cache = {} as any;

export const calcRealId = (docId, pageNum) => {
  if (Utils.isNullOrEmpty(docId) || !_.isString(docId)) {
    return null;
  }

  if (pageNum == null) {
    return null;
  }

  if (!Utils.isNullOrEmpty(docId)) {
    docId += `-${pageNum}`;
  }
  return docId;
};

const AnnotationEditorImages = React.memo((props: PropsWithChildren<IAnnotationEditorImagesProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [globalScale, setGlobalScale] = useState(1);
  const [scaleModified, setScaleModified] = useState(false);
  const [imageWidth, setImageWidth] = useState(null);
  const [imageHeight, setImageHeight] = useState(null);
  const [hideLabels, setHideLabels] = useState(false);

  const [selRect, setSelRect] = useState(null as ISelRect);
  const [isSelRectDrawing, setIsSelRectDrawing] = useState(false);
  const [initOverlapSelRects, setInitOverlapSelRects] = useState(null);
  const [pageTokens, setPageTokens] = useState(null as IPageToken[]);
  const [selRectList, setSelRectList] = useState(null as ISelRect[]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imgBase64, setImgBase64] = useState(null);
  const [imgBase64ForUrl, setImgBase64ForUrl] = useState(null);
  const [editValue, setEditValue] = useState('');

  const refImg = useRef<HTMLImageElement>(null);

  const resizeUsingOnMove = useRef(null as (rect1, xDiff, yDiff, e) => void);
  const resizeUsing = useRef(null as any);

  let list = props.selRectListOri;
  useEffect(() => {
    if (_.isString(list)) {
      list = null;
    }
    setSelRectList(list ?? null);
  }, [list]);

  useEffect(() => {
    if (props.extractedFeatures?.tokens == null) {
      setPageTokens(null);
    } else {
      let res = [];

      props.extractedFeatures?.tokens?.some((t1, t1ind) => {
        let r1: any = {};

        r1.page = t1?.page;

        r1.id = t1ind;

        r1.x = t1?.boundingBox?.[0];
        r1.y = t1?.boundingBox?.[1];
        r1.width = t1?.boundingBox?.[2] - r1.x;
        r1.height = t1?.boundingBox?.[3] - r1.y;

        r1.text = t1.content;

        r1.dataOri = t1;

        res.push(r1);
      });

      setPageTokens(res ?? []);
    }
  }, [props.extractedFeatures, props.pageNumber]);

  useEffect(() => {
    props.onIsProcessingOCR?.(isProcessingOCR);
  }, [isProcessingOCR]);

  useEffect(() => {
    props.onIsLoadingImage?.(isLoadingImage);
  }, [isLoadingImage]);

  const imgUrl = useMemo(() => {
    let docId1 = props.docId ?? props.data?.docId;
    if (Utils.isNullOrEmpty(docId1) || !_.isString(docId1)) {
      return null;
    }

    const docId = docId1;
    const imageDocId = props.pageNumber != null ? calcRealId(docId, props.pageNumber - 1) : docId;
    return calcImageDocIdUrl(imageDocId);
  }, [props.data, props.docId]);

  useEffect(() => {
    if (Utils.isNullOrEmpty(imgUrl)) {
      setImgBase64(null);
      setImgBase64ForUrl(null);
      return;
    }

    let cache1 = imgBase64Cache[imgUrl];
    if (cache1 != null) {
      setImgBase64(cache1);
      setImgBase64ForUrl(imgUrl);
      return;
    }

    const imgUrlTemp = imgUrl;
    setIsLoadingImage(true);
    UtilsWeb.convertUrlToBase64(
      imgUrlTemp,
      (res) => {
        imgBase64Cache[imgUrlTemp] = res;

        setIsLoadingImage(false);
        setImgBase64(res);
        setImgBase64ForUrl(imgUrlTemp);
      },
      false,
      'image/jpeg',
    );
  }, [imgUrl]);

  const onLoadImg = (e) => {
    setTimeout(() => {
      setImageWidth(refImg.current?.naturalWidth ?? null);
      setImageHeight(refImg.current?.naturalHeight ?? null);
    }, 0);
  };

  const marginImg = 20;

  const initialScale = useMemo(() => {
    if (imageWidth == null || imageHeight == null) return 1;
    let res = 1;
    if (imageWidth > imageHeight) {
      res = imageHeight / imageWidth;
    } else {
      res = imageWidth / imageHeight;
    }
    return res;
  }, [imageWidth, imageHeight]);

  const imgOnMouseDown = (scaleUse, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (props.showReviewNotStartedWarning) {
      REActions.addNotificationError('Please click on "Start Document Review" to start labeling the document');
      return;
    }

    if (props.readonly) {
      return;
    }

    let forceRect = resizeUsing.current;

    const doWork = (label1) => {
      if (forceRect == null && Utils.isNullOrEmpty(label1)) {
        REActions.addNotificationError('Please first select a label from the top label selector');
        return;
      }

      setSelRect((r1) => {
        var rect = refImg.current?.getBoundingClientRect();
        let x1 = e.clientX - rect.left;
        let y1 = e.clientY - rect.top;

        if (forceRect != null) {
          r1 = { ...forceRect };

          r1.x *= scaleUse;
          r1.y *= scaleUse;
          r1.width *= scaleUse;
          r1.height *= scaleUse;

          r1.scaleUse = scaleUse;

          r1.lastMoveX = x1;
          r1.lastMoveY = y1;
        } else {
          r1 = { ...(r1 ?? {}) };

          r1.x = x1;
          r1.y = y1;

          r1.scaleUse = scaleUse;

          r1.width = 1;
          r1.height = 1;

          r1.lastMoveX = r1.x;
          r1.lastMoveY = r1.y;

          r1.label = label1;
        }

        setInitOverlapSelRects(r1?.overlapSelRects ?? []);

        return r1;
      });
      setIsSelRectDrawing(true);
    };

    if (forceRect != null) {
      doWork(null);
    } else {
      let label1 = props.onNeedCurrentLabel?.();
      if (label1 == null) {
        doWork(null);
      } else {
        label1.then((s1) => {
          doWork(s1);
        });
      }
    }
  };

  const imgOnMouseMove = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (props.readonly) {
      return;
    }

    let forceRect = resizeUsing.current;

    setIsSelRectDrawing((is1) => {
      if (is1) {
        setSelRect((r1) => {
          r1 = { ...(r1 ?? {}) };

          var rect = refImg.current?.getBoundingClientRect();
          let x1 = e.clientX - rect.left;
          let y1 = e.clientY - rect.top;

          let xDiff = x1 - r1.lastMoveX;
          let yDiff = y1 - r1.lastMoveY;
          if (forceRect == null) {
            r1.width += xDiff;
            r1.height += yDiff;
          } else {
            resizeUsingOnMove.current?.(r1, xDiff, yDiff, e);
          }

          r1.lastMoveX = x1;
          r1.lastMoveY = y1;

          return r1;
        });
      }

      return is1;
    });
  };

  const doFinishSelRectUse = (addRect = false) => {
    let overlapSelRectsIds = [...(refSelRectActualIds.current ?? [])];
    let overlapTokens = [...(refSelRectActualTokens.current ?? [])];

    let forceRect = resizeUsing.current;
    resizeUsing.current = null;

    setSelRect((r1) => {
      if (addRect === true && r1 != null) {
        const minSize = 4;
        r1 = autoFixSelRect(r1);

        if (r1?.width > minSize && r1?.height > minSize) {
          setInitOverlapSelRects((initRectsList) => {
            setSelRectList((list) => {
              list = [...(list ?? [])];

              if (forceRect != null) {
                list = list.filter((a1) => a1 !== forceRect);
              }

              let sel1: ISelRect = { ...r1 };

              let scaleUse = sel1?.scaleUse;

              if (scaleUse != null && sel1 != null) {
                sel1.x /= scaleUse;
                sel1.y /= scaleUse;
                sel1.width /= scaleUse;
                sel1.height /= scaleUse;
              }

              let lastOverlapSelRects = sel1.overlapSelRects;
              sel1.overlapSelRects = overlapSelRectsIds;

              let isOverlapSelRectsEqualToInit = false;
              let lastText = null;
              if (forceRect != null) {
                let value1 = '';

                let initRectsListRects = [];
                pageTokens?.some((t1, t1ind) => {
                  if (lastOverlapSelRects?.includes(t1?.id)) {
                    initRectsListRects.push(t1);
                  }
                });

                initRectsListRects?.some((t1, t1ind) => {
                  if (Utils.isNullOrEmpty(t1?.text)) {
                    return;
                  }

                  if (t1ind > 0) {
                    value1 += ' ';
                  }

                  value1 += t1?.text ?? '';
                });

                lastText = value1;
                if (sel1?.value === lastText) {
                  isOverlapSelRectsEqualToInit = true;
                }
              }

              if (forceRect == null || isOverlapSelRectsEqualToInit) {
                let value1 = '';
                overlapTokens?.some((t1, t1ind) => {
                  if (Utils.isNullOrEmpty(t1?.text)) {
                    return;
                  }

                  if (t1ind > 0) {
                    value1 += ' ';
                  }

                  value1 += t1?.text ?? '';
                });
                sel1.value = value1;
              }

              list.push(sel1);

              props.onChangeAnnotations?.(list);

              return list;
            });

            return initRectsList;
          });
        }
      }

      //r1 save

      return null;
    });
    setIsSelRectDrawing(false);
  };

  const imgOnMouseUp = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (props.readonly) {
      return;
    }
    doFinishSelRectUse(true);
  };

  const parentImgOnMouseOut = (e) => {
    // doFinishSelRectUse();
  };

  const autoScaleSelRect: (selRectParam?: ISelRect, useScale?) => ISelRect = (selRectParam?: ISelRect, useScale?) => {
    let selRect = selRectParam == null ? null : { ...selRectParam };

    if (useScale != null && selRect != null) {
      selRect.x *= useScale;
      selRect.y *= useScale;
      selRect.width *= useScale;
      selRect.height *= useScale;
    }

    return selRect;
  };

  const autoFixSelRect: (selRectParam?: ISelRect, useScale?) => ISelRect = (selRectParam?: ISelRect, useScale?) => {
    let selRect = selRectParam == null ? null : { ...selRectParam };

    if (selRect?.width < 0) {
      selRect.width *= -1;
      selRect.x -= selRect.width;
    }
    if (selRect?.height < 0) {
      selRect.height *= -1;
      selRect.y -= selRect.height;
    }

    if (useScale != null && selRect != null) {
      selRect = autoScaleSelRect(selRect, useScale);
    }

    return selRect;
  };

  const drawTokensSelIdsLast = useRef(null);
  const drawTokensFinalIds = useMemo(() => {
    let idsSorted = null;
    if (pageTokens == null || pageTokens.length === 0) {
      //
    } else {
      let already: any = {};

      selRectList?.some((r1) => {
        r1?.overlapSelRects?.some((r2id) => {
          if (!already[r2id] && r2id != null) {
            already[r2id] = true;

            idsSorted ??= [];
            idsSorted.push(r2id);
          }
        });
      });

      idsSorted = idsSorted?.sort();
    }

    if (_.isEqual(idsSorted, drawTokensSelIdsLast.current)) {
      return drawTokensSelIdsLast.current;
    }
    drawTokensSelIdsLast.current = idsSorted;

    return idsSorted;
  }, [selRectList, pageTokens]);

  const drawTokensFinal = useMemo(() => {
    return pageTokens?.filter((t1) => drawTokensFinalIds?.includes(t1?.id));
  }, [drawTokensFinalIds, pageTokens]);

  const pageTokensById = useMemo(() => {
    if (pageTokens == null) {
      return null;
    } else {
      let res: any = {};
      pageTokens?.some((t1) => {
        res[t1?.id] = t1;
      });
      return res;
    }
  }, [pageTokens]);

  const refSelRectActualIds = useRef(null as any[]);
  const refSelRectActualTokens = useRef(null as IPageToken[]);
  const zoomFactor = 1.2;

  return (
    <div>
      <div className={styles.imageViewerButtonsContainer}>
        <TooltipExt title={hideLabels ? 'Show Labels' : 'Hide Labels'}>
          <Button size="small" ghost className={styles.imageViewerButton} onClick={() => setHideLabels(!hideLabels)}>
            <FontAwesomeIcon icon={hideLabels ? require('@fortawesome/pro-regular-svg-icons/faEye').faEye : require('@fortawesome/pro-regular-svg-icons/faEyeSlash').faEyeSlash} transform={{ size: 14 }} />
          </Button>
        </TooltipExt>
        <TooltipExt title="Zoom In">
          <Button size="small" ghost className={styles.imageViewerButton} onClick={() => setGlobalScale(globalScale * zoomFactor)}>
            <FontAwesomeIcon icon={['far', 'magnifying-glass-plus']} transform={{ size: 14 }} />
          </Button>
        </TooltipExt>
        <TooltipExt title="Zoom out">
          <Button size="small" ghost className={styles.imageViewerButton} onClick={() => setGlobalScale(globalScale / zoomFactor)}>
            <FontAwesomeIcon icon={['far', 'magnifying-glass-minus']} transform={{ size: 14 }} />
          </Button>
        </TooltipExt>
      </div>
      <div
        className={sd.absolute}
        css={`
          overflow: auto;
          display: flex;
          justify-content: center;
        `}
      >
        <AutoSizer style={{ overflow: 'hidden', width: 'fit-content', height: 'fit-content' }}>
          {({ width }) => {
            let ww = width - 2 * marginImg;

            let wwImg = Math.trunc(imageWidth * initialScale * globalScale);
            let hhImg = Math.trunc(imageHeight * initialScale * globalScale);

            let scale1 = 1;
            let wwMax = Math.trunc(ww * 0.6 * globalScale);
            if (wwImg > wwMax) {
              scale1 = wwMax / wwImg;
              wwImg = Math.trunc(wwImg * scale1);
              hhImg = Math.trunc(hhImg * scale1);
            }

            const calcRect = (selRectParam, key1?, useScale?, forceBorder?, checkSelRectOverlaps?, isUserRect = false) => {
              if (checkSelRectOverlaps != null) {
                if (!calcRectOverlap(autoScaleSelRect(selRectParam, useScale), autoFixSelRect(checkSelRectOverlaps), 5)) {
                  return null;
                }
              }

              let color1 = '#4990E2';

              if (!Utils.isNullOrEmpty(selRectParam?.text)) {
                color1 = Utils.stringToColorHex(selRectParam?.text, true);
              }

              let forceScale = useScale ?? 1;

              let selRect = autoFixSelRect(selRectParam, forceScale);

              let useRectElems = null;
              if (isUserRect) {
                const circleWW = 10;
                const closeWW = 12;

                const selRectParamUse = selRectParam;

                const onRemove = (e) => {
                  e?.preventDefault?.();
                  e?.stopPropagation?.();

                  setSelRectList((list) => {
                    list = [...(list ?? [])];

                    list = list.filter((r1) => r1 !== selRectParamUse);
                    props.onChangeAnnotations?.(list);

                    return list;
                  });
                };

                const createResize = (key1, customCss?, faIcon?, onMove?: (rect1, xDiff, yDiff, e) => void) => {
                  const onMouseDown = (e) => {
                    resizeUsing.current = selRectParam;
                    resizeUsingOnMove.current = onMove;
                  };

                  return (
                    <div
                      onMouseDown={onMouseDown}
                      key={key1}
                      className={sd.pointerEventsAll}
                      css={`
                        position: absolute;
                        ${customCss};
                        width: ${circleWW}px;
                        height: ${circleWW}px;
                        background-color: #2ab4dc;
                        border: 1px solid #000000aa;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0.6;
                        &:hover {
                          opacity: 1;
                        }
                      `}
                    >
                      {faIcon !== null && (
                        <FontAwesomeIcon
                          icon={faIcon ?? require('@fortawesome/pro-regular-svg-icons/faTimes').faTimes}
                          transform={{ size: 9, x: 0, y: 0 }}
                          css={`
                            color: black;
                          `}
                        />
                      )}
                    </div>
                  );
                };

                useRectElems = props.readonly
                  ? []
                  : [
                      <div
                        key={'resizeRemove'}
                        className={sd.pointerEventsAll}
                        onMouseDown={onRemove}
                        css={`
                          position: absolute;
                          top: -${closeWW / 2}px;
                          right: -${closeWW / 2}px;
                          width: ${closeWW}px;
                          height: ${closeWW}px;
                          background-color: #cc7777;
                          border: 1px solid #cc7777aa;
                          border-radius: 50%;
                          cursor: pointer !important;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        `}
                      >
                        <FontAwesomeIcon
                          icon={require('@fortawesome/pro-regular-svg-icons/faTimes').faTimes}
                          transform={{ size: 9, x: 0, y: 0 }}
                          css={`
                            color: black;
                          `}
                        />
                      </div>,

                      createResize('resizeTopLeftSel', `cursor: nw-resize !important; left: -${circleWW / 2}px; top: -${circleWW / 2}px;`, null, (rect1, xDiff, yDiff, e) => {
                        if (rect1 != null) {
                          rect1.x += xDiff;
                          rect1.width -= xDiff;
                          rect1.y += yDiff;
                          rect1.height -= yDiff;
                        }
                      }),
                      createResize('resizeBottomLeftSel', `cursor: sw-resize !important; left: -${circleWW / 2}px; bottom: -${circleWW / 2}px;`, null, (rect1, xDiff, yDiff, e) => {
                        if (rect1 != null) {
                          rect1.x += xDiff;
                          rect1.width -= xDiff;
                          rect1.height += yDiff;
                        }
                      }),
                      createResize('resizeBottomRightSel', `cursor: se-resize !important; right: -${circleWW / 2}px; bottom: -${circleWW / 2}px;`, null, (rect1, xDiff, yDiff, e) => {
                        if (rect1 != null) {
                          rect1.width += xDiff;
                          rect1.height += yDiff;
                        }
                      }),
                    ];
              }

              const onEditValueSave = (e) => {
                setEditValue((s1) => {
                  setSelRectList((list) => {
                    if (list != null) {
                      let ind = _.findIndex(list, (a1) => a1 === selRectParam);
                      if (ind > -1) {
                        let r1 = list?.[ind];
                        if (r1 != null) {
                          r1 = { ...r1 };
                          r1.value = s1 ?? '';

                          list = [...(list ?? [])];
                          list[ind] = r1;

                          props.onChangeAnnotations?.(list);
                        }
                      }
                    }
                    return list;
                  });

                  return null;
                });
              };

              const onClickValue = (e) => {
                setEditValue(selRect?.value ?? '');

                props.onMouseEnterLabel?.(null, e);

                e?.preventDefault?.();
                e?.stopPropagation?.();
              };

              const editValueElem = (
                <div css={``}>
                  <Input.TextArea
                    rows={7}
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value ?? '');
                    }}
                  />
                </div>
              );

              const onMouseDownLabel = (e) => {
                e?.preventDefault?.();
                e?.stopPropagation?.();
              };

              const onMouseEnterLabel = (value1, e) => {
                props.onMouseEnterLabel?.(value1, e);
              };

              let mouseEnterValues = [] as { key: string; value: any }[];

              if (selRect?.value != null) {
                mouseEnterValues.push({ key: 'Value', value: selRect?.value });
              }

              if (selRect?.label != null) {
                mouseEnterValues.push({ key: 'Label', value: selRect?.label });
              }

              if (selRect?.meanProbability != null) {
                mouseEnterValues.push({ key: 'Mean Probability', value: Utils.decimals(selRect?.meanProbability, 5) });
              }

              if (selRect?.minProbability != null) {
                mouseEnterValues.push({ key: 'Min Probability', value: Utils.decimals(selRect?.minProbability, 5) });
              }

              if (selRect?.maxProbability != null) {
                mouseEnterValues.push({ key: 'Max Probability', value: Utils.decimals(selRect?.maxProbability, 5) });
              }

              let label1 = isUserRect && !Utils.isNullOrEmpty(selRect?.label) && (
                <div
                  onMouseDown={onMouseDownLabel}
                  onMouseMove={onMouseEnterLabel.bind(null, mouseEnterValues)}
                  onMouseOut={onMouseEnterLabel.bind(null, null)}
                  key={'label_' + key1}
                  className={sd.pointerEventsAll}
                  css={`
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    padding: 2px 4px;
                    font-size: 11px;
                    background-color: #2a2a2aaa;
                    border: 1px solid #2a2a2a;
                    line-height: 1;
                    white-space: nowrap;
                  `}
                >
                  {selRect?.label}
                  {allowEdit && (
                    <ModalContent onClick={onClickValue} onConfirm={onEditValueSave} width={440} title={'Edit Value'} content={editValueElem} okText={'Set'} okType={'primary'} cancelText={'Cancel'}>
                      <FontAwesomeIcon
                        icon={require('@fortawesome/pro-duotone-svg-icons/faEdit').faEdit}
                        css={`
                          margin-left: 4px;
                          font-size: 11px;
                          cursor: pointer !important;
                        `}
                      />
                    </ModalContent>
                  )}
                </div>
              );

              const onMouseDownRectUser = (e) => {
                if (resizeUsing.current != null) {
                  return;
                }

                resizeUsing.current = selRectParam;
                resizeUsingOnMove.current = (rect1, xDiff, yDiff, e) => {
                  if (rect1 != null) {
                    rect1.x += xDiff;
                    rect1.y += yDiff;
                  }
                };
              };

              let res = (
                <div
                  onMouseDown={isUserRect ? onMouseDownRectUser : undefined}
                  key={key1}
                  className={isUserRect ? '' : sd.pointerEventsNone}
                  css={`
                    z-index: 20;
                    position: absolute;
                    left: ${/*marginImg+ */ /*marLeft+*/ selRect?.x ?? 0}px;
                    top: ${/*marginImg+ */ selRect?.y ?? 0}px;
                    width: ${selRect?.width ?? 0}px;
                    height: ${selRect?.height ?? 0}px;
                    border: ${forceBorder ?? 2}px solid ${color1}AA;
                    background-color: ${color1}33;
                    ${isUserRect ? 'cursor: move !important; ' : ''}
                  `}
                >
                  {!hideLabels && label1}
                  {useRectElems}
                </div>
              );

              return res;
            };

            let selRectActualTokens = null;
            let selRectActualList = null;
            let selRectActualIds = null;
            if (isSelRectDrawing) {
              pageTokens?.some((t1, t1ind) => {
                let id1 = t1?.id;

                if ((t1?.dataOri?.page ?? 0) + 1 !== props.pageNumber && props.pageNumber != null) {
                  return;
                }

                let res = calcRect(t1, 'tok_' + id1, globalScale * scale1 * initialScale, 1, selRect);
                if (res != null) {
                  selRectActualIds ??= [];
                  selRectActualIds.push(id1);

                  selRectActualList ??= [];
                  selRectActualList.push(res);

                  selRectActualTokens ??= [];
                  selRectActualTokens.push(t1);
                }
              });

              refSelRectActualIds.current = selRectActualIds;
              refSelRectActualTokens.current = selRectActualTokens;
            }

            return (
              <div
                key={'parentImg'}
                css={`
                  position: relative;
                `}
                onMouseOut={parentImgOnMouseOut}
              >
                <div
                  onMouseDown={imgOnMouseDown.bind(null, globalScale * scale1 * initialScale)}
                  onMouseUp={imgOnMouseUp}
                  onMouseMove={imgOnMouseMove}
                  css={`
                    position: relative;
                    margin: 32px 80px;
                    overflow: auto;
                    cursor: crosshair;
                  `}
                >
                  <img
                    ref={refImg}
                    onLoad={onLoadImg}
                    src={imgBase64 || Constants.transparentPixelBase64}
                    alt={''}
                    css={`
                      object-fit: contain;
                      width: ${wwImg}px;
                      height: ${hhImg}px;
                    `}
                  />
                  {selRect != null && calcRect(selRect, 'selRectKey')}
                  {selRectActualList}
                  {!isSelRectDrawing &&
                    !isLoadingImage &&
                    drawTokensFinal?.map((t1, t1ind) => {
                      let page1 = t1?.dataOri?.page;
                      if (page1 != null && page1 + 1 !== props.pageNumber && props.pageNumber != null) {
                        return null;
                      }

                      return calcRect(t1, 'tok_overlap_' + t1?.id, globalScale * scale1 * initialScale, 1);
                    })}

                  {!isSelRectDrawing &&
                    !isLoadingImage &&
                    !isProcessingOCR &&
                    selRectList?.map((t1, t1ind) => {
                      if (t1?.forcePageNumber != null) {
                        if (props.pageNumber != null && t1?.forcePageNumber + 1 !== props.pageNumber) {
                          return null;
                        }
                      } else {
                        let page1 = pageTokens?.[t1?.overlapSelRects?.[0]]?.dataOri?.page;
                        if (page1 != null && props.pageNumber != null && page1 + 1 !== props.pageNumber) {
                          return null;
                        }
                      }

                      return calcRect(t1, 'tok_overlap_rect_' + t1ind, globalScale * scale1 * initialScale, undefined, undefined, true);
                    })}
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
});

export default AnnotationEditorImages;
