/* eslint-disable no-irregular-whitespace */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import DOMPurify from 'dompurify';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import Utils from '../../../core/Utils';
const s = require('./DagViewer.module.css');
const sd = require('../antdUseDark.module.css');

interface IDagViewerProps {}

const DagViewer = React.memo((props: PropsWithChildren<IDagViewerProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [svg, setSvg] = useState(`<svg width="1229" height="1241" viewBox="0 0 1364.87 734.35" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
</svg>`);

  const svgUsePurify = useMemo(() => {
    if (svg == null) {
      return svg;
    } else {
      let res = DOMPurify.sanitize(svg);

      if (res != null) {
        let s1 = res?.match(/<polygon [^>]*>/gi)?.[0];
        if (s1 != null && s1 !== '') {
          let s2 = s1.replace('fill="white"', 'fill="transparent"');
          res = res.replace(s1, s2);
        }
      }

      return res;
    }
  }, [svg]);

  const [svgWW, svgHH, svgViewBox, svgUse] = useMemo(() => {
    let svgWW, svgHH, svgViewBox;
    let svgUse = svgUsePurify;

    if (svgUse != null) {
      let s1 = svgUse?.match(/<svg[^>]*>/g)?.[0];
      let sww = / width=['"](?<ww>[^ '"]*)/gi.exec(s1);
      let shh = / height=['"](?<hh>[^ '"]*)/gi.exec(s1);
      let svb = / viewBox=['"](?<vb>[^'"]*)/gi.exec(s1);
      svgWW = Utils.tryParseInt(sww?.groups?.ww);
      svgHH = Utils.tryParseInt(shh?.groups?.hh);

      svgViewBox = svb?.groups?.vb || undefined;
      if (svgViewBox != null) {
        let ss = svgViewBox.split(' ');
        svgWW = Utils.tryParseInt(ss[3]);
        svgHH = Utils.tryParseInt(ss[4]);
      }

      // if(svgWW!=null && svgHH!=null) {
      //   let m1 = Math.max(svgWW, svgHH)+200;
      //   svgViewBox = '0 0 '+m1+' '+m1;
      // }

      let sT0 = svgUse?.match(/<svg[^>]*>/g)?.[0];
      let sT1 = _.reverse(svgUse?.match(/<\/svg>/g) ?? [])?.[0];
      svgUse = svgUse?.replace(sT0, '')?.replace(sT1, '');
    }

    return [svgWW, svgHH, svgViewBox, svgUse];
  }, [svgUsePurify]);

  const mar = 20;

  return (
    <div
      css={`
        position: absolute;
        top: ${mar}px;
        left: ${mar}px;
        right: ${mar}px;
        bottom: ${mar}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 10px;
        overflow: hidden;
      `}
    >
      <AutoSizer>
        {({ height, width }) => {
          if (width === 0 || height === 0 || Utils.isNullOrEmpty(svgUse)) {
            return null;
          }

          return (
            <div
              css={`
                position: relative;
                width: ${width}px;
                height: ${height}px;
              `}
            >
              <TransformWrapper centerOnInit initialScale={1}>
                {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                  <React.Fragment>
                    <div
                      css={`
                        margin-top: 10px;
                        display: flex;
                        gap: 5px;
                        position: absolute;
                        z-index: 10;
                        left: 50%;
                        transform: translateX(-50%);
                      `}
                    >
                      <Button type={'primary'} onClick={() => zoomIn()}>
                        <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faMagnifyingGlassPlus').faMagnifyingGlassPlus} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer' }} />
                      </Button>
                      <Button type={'primary'} onClick={() => zoomOut()}>
                        <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faMagnifyingGlassMinus').faMagnifyingGlassMinus} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer' }} />
                      </Button>
                      <Button type={'primary'} onClick={() => resetTransform()}>
                        <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faMaximize').faMaximize} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer' }} />
                      </Button>
                    </div>
                    <TransformComponent>
                      <div
                        css={`
                          position: relative;
                          width: ${width}px;
                          height: ${height}px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        `}
                      >
                        <svg width={svgWW} height={svgHH} viewBox={svgViewBox} xmlns="http://www.w3.org/2000/svg" xlinkHref="http://www.w3.org/1999/xlink" dangerouslySetInnerHTML={{ __html: svgUse }} />
                      </div>
                    </TransformComponent>
                  </React.Fragment>
                )}
              </TransformWrapper>
            </div>
          );
        }}
      </AutoSizer>
    </div>
  );
});

export default DagViewer;
