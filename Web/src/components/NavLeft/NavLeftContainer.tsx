import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';

import Utils, { calcImgSrc } from '../../../core/Utils';
import Constants from '../../constants/Constants';

import HelpItemsNavLinks from '../HelpItemsNavLinks/HelpItemsNavLinks';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';

import { topHHsearch, topHH } from './utils';
import { NavLeftFreeConsultation } from './NavLeftFreeConsultation';
import TooltipExt from '../TooltipExt/TooltipExt';

const styleRoot: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
  backgroundColor: Constants.navBackColor(),
  top: (Constants.flags.show_search_top ? 0 : topHHsearch) + 'px',
  bottom: Constants.NavBottomHeight + 'px',
  left: 0,
  width: Constants.navWidth + 'px',
};

interface NavLeftContainerProps {
  onClickExpand: (e: any) => void;
  onClickLogo: (e: any) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClickRoot: (e: any) => void;
  onNotebookInside: boolean;
  showFreeConsultation: boolean;
  navLeftCollapsed: boolean;
}

export const NavLeftContainer = React.memo(function NavLeftContainer(props: React.PropsWithChildren<NavLeftContainerProps>) {
  let bottomHH = 36;

  if (props.showFreeConsultation) {
    bottomHH += 153;
  }

  if (props.navLeftCollapsed) {
    return (
      <div
        onClick={props.onClickRoot}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        style={{
          borderRight: '1px solid black',
          position: 'absolute',
          backgroundColor: Constants.navBackColor(),
          top: (Constants.flags.show_search_top ? 0 : topHHsearch) + 'px',
          bottom: Constants.NavBottomHeight + 'px',
          left: 0,
          width: Constants.navWidthCollapsed + 'px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: (Constants.flags.show_search_top ? topHHsearch || topHH : topHH) + 'px',
            left: 0,
            width: Constants.navWidthCollapsed + 'px',
            textAlign: 'center',
            backgroundColor: Constants.navHeaderColor(),
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <TooltipExt placement="right" overlay={<span>Expand Navigator</span>}>
              <span style={{ cursor: 'pointer', color: 'white', fontWeight: 500, fontSize: '20px', display: 'table', margin: 'auto auto', paddingRight: '2px' }}>
                <span style={{ color: 'white', paddingRight: '6px', cursor: 'pointer' }} onClick={props.onClickExpand}>
                  <FontAwesomeIcon icon={['far', 'angle-right']} transform={{ size: 19, x: 0, y: 1 }} />
                </span>
                <span style={{ color: 'white', marginRight: '6px' }}>
                  <img src={Constants.transparentPixelBase64} alt={''} style={{ height: '28px', width: '1px', backgroundColor: Utils.colorA(0.4) }} />
                </span>
                <span style={{ verticalAlign: 'top', display: 'table-cell' }}>
                  <span style={{ color: 'white' }}>
                    <img alt={''} src={calcImgSrc('/app/imgs/reAlone' + 80 + '.png')} style={{ width: '22px' }} />
                  </span>
                </span>
              </span>
            </TooltipExt>
          </div>
        </div>

        <div style={{ position: 'absolute', top: (Constants.flags.show_search_top ? topHHsearch || topHH : topHH) + 'px', left: 0, right: 0, bottom: 0 + 'px' }}>
          <NanoScroller>
            <div>
              <div>
                <div style={{ marginTop: '20px' }}>{props.children}</div>
              </div>
            </div>
          </NanoScroller>
        </div>
      </div>
    );
  }

  return (
    <div id={'navLeftOne'} style={styleRoot} onMouseEnter={props.onMouseEnter} onMouseLeave={props.onMouseLeave}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          height: (Constants.flags.show_search_top ? topHHsearch || topHH : topHH) + 'px',
          left: 0,
          width: Constants.navWidth + 'px',
          textAlign: 'center',
          backgroundColor: /*(ShowTopHeader(mode)) ? '#000' : */ Constants.navHeaderColor(),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <span style={{ cursor: 'pointer', color: 'white', fontWeight: 500, fontSize: '20px', display: 'table', margin: 'auto auto', paddingRight: '2px' }}>
            <span style={{ verticalAlign: 'top', display: 'table-cell' }}>
              <span css={props.onNotebookInside ? `visibility: hidden;` : ''} style={{ color: 'white', paddingRight: '12px', cursor: props.onNotebookInside ? '' : 'pointer' }} onClick={props.onNotebookInside ? null : props.onClickExpand}>
                <FontAwesomeIcon icon={['far', 'angle-left']} transform={{ size: 19, x: 0, y: 1 }} />
              </span>
              <span style={{ color: 'white', marginRight: '12px' }}>
                <img src={Constants.transparentPixelBase64} alt={''} style={{ height: '28px', width: '1px', backgroundColor: Utils.colorA(0.4) }} />
              </span>
              <span style={{ color: 'white' }}>
                <Link to={'/'} onClick={props.onClickLogo}>
                  <img alt={''} src={calcImgSrc('/app/imgs/logo_text' + 80 + '.png')} style={{ width: '182px' }} />
                </Link>
              </span>
            </span>
          </span>
        </div>
      </div>

      <div style={{ position: 'absolute', top: (Constants.flags.show_search_top ? topHHsearch || topHH : topHH) + 'px', left: 0, right: 0, bottom: bottomHH + 'px' }}>
        <NanoScroller>
          <div style={{ marginTop: '20px' }}>{props.children}</div>
        </NanoScroller>
      </div>
      <div style={{ position: 'absolute', height: bottomHH + 'px', left: 0, right: 0, bottom: 0, color: Utils.colorA(0.8) }}>
        {props.showFreeConsultation && <NavLeftFreeConsultation />}

        <HelpItemsNavLinks />
      </div>
    </div>
  );
});
