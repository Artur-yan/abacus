import styledComponent, { CSSProp, css as cssProperty } from 'styled-components';
import { DOMAttributes, DetailedHTMLProps } from 'react';

declare module 'react' {
  //HTMLAttributes<T> extends
  interface DOMAttributes<T> {
    css?: CSSProp;
    marginBottom?: number;
    marginTop?: number;
    noColor?: boolean;
    colorUse?: string;
    isSelected?: boolean;
  }

  interface DetailedHTMLProps<T> {
    css?: CSSProp;
    marginBottom?: number;
    marginTop?: number;
    noColor?: boolean;
    colorUse?: string;
    isSelected?: boolean;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      css?: CSSProp;
    }
  }
}
