import * as OverlayScrollbars from 'overlayscrollbars';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import memoizeOne from '../../libs/memoizeOne';
import { OverlayScrollbarsComponentRef } from 'overlayscrollbars-react/types/OverlayScrollbarsComponent';
const s = require('./NanoScroller.module.css');
const sd = require('../antdUseDark.module.css');

interface INanoScrollerProps {
  style?: object;
  noWhite?: boolean;
  onlyVertical?: boolean;
  onlyHorizontal?: boolean;
  onInit?: () => void;
  useDark?: boolean;
  useShadow?: boolean;
  shadowMargins?: object;
  noAuto?: boolean;
  noHide?: boolean;
  savePosition?: string;
  isPreparing?: boolean;
  isVisible?: boolean;
  onScrollBottom?: (perc: number) => void;
}

class NanoScroller extends React.PureComponent<PropsWithChildren<INanoScrollerProps>, any> {
  private isM: boolean;
  private alreadyPreparedLastPos: boolean;
  private isAtBottom = false;
  private refOverScroll = React.createRef<OverlayScrollbarsComponentRef<any>>();

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
  }

  memOptions = memoizeOne((props) => {
    // @ts-ignore
    let obj: OverlayScrollbars.Options = OverlayScrollbars.OverlayScrollbars.env().getDefaultOptions() ?? {};

    let isLight = !this.props.noWhite;
    // @ts-ignore
    obj.scrollbars ??= {};
    obj.scrollbars.theme = 'os-theme-dark';
    if (isLight) {
      obj.scrollbars.theme = 'os-theme-light';
    }
    if (this.props.onlyVertical) {
      // @ts-ignore
      obj.overflow ??= {};
      obj.overflow.x = 'hidden';
    }
    if (this.props.onlyHorizontal) {
      // @ts-ignore
      obj.overflow ??= {};
      obj.overflow.y = 'hidden';
    }

    // @ts-ignore
    obj.scrollbars ??= {};
    obj.scrollbars.visibility = 'auto';
    obj.scrollbars.autoHide = this.props.noHide ? 'never' : this.props.noAuto ? 'scroll' : 'leave';

    let cc = obj['className'];
    if (cc == null) {
      cc = '';
    }
    cc += ' ' + sd.absolute + ' ' + (this.props.isVisible === false ? sd.nonVisibility : '');
    obj['className'] = cc;

    return obj;
  });

  calcRatioY = () => {
    let vp1 = this.calcViewport();
    if (vp1 == null) {
      return vp1 as null | undefined;
    } else {
      return (vp1.scrollTop || vp1.scrollTop) / (vp1.scrollHeight - vp1.clientHeight);
    }
  };

  memEvents = memoizeOne((props) => {
    let res: any = {};

    res.scroll = (instance: OverlayScrollbars.OverlayScrollbars, event: Event) => {
      let ratioY = this.calcRatioY();

      if (ratioY > 0.92) {
        if (!this.isAtBottom) {
          this.isAtBottom = true;
          this.props.onScrollBottom?.(ratioY);
        }
      } else {
        if (this.isAtBottom) {
          this.isAtBottom = false;
        }
      }
    };

    return res;
  });

  componentWillUnmount() {
    this.isM = false;
  }

  getScroll = () => {
    return this.calcViewport()?.scrollTop;
  };

  scrollTop = () => {
    this.scrollTo({ y: 0 }, 200);
  };

  scrollBottom = () => {
    this.scrollTo({ y: '100%' }, 200);
  };

  scroll = (posY) => {
    this.scrollTo({ y: posY }, 200);
  };

  scrollXY = (posX, posY) => {
    this.scrollTo({ x: posX, y: posY }, 0);
  };

  update = () => {
    this.scrollContainer()?.update();
  };

  scrollContainer = () => {
    // @ts-ignore
    return this.refOverScroll.current?.osInstance?.();
  };

  calcViewport = () => {
    return this.scrollContainer()?.elements()?.viewport;
  };

  scrollTo = (options?, y?) => {
    this.calcViewport()?.scroll(options, y);
  };

  render() {
    let options = this.memOptions(this.props);
    let events = this.memEvents(this.props);
    let className1 = options?.className;

    return (
      <OverlayScrollbarsComponent options={options} ref={this.refOverScroll} className={className1} events={events}>
        {this.props.children}
      </OverlayScrollbarsComponent>
    );
  }
}

export default NanoScroller;
