import React, { PropsWithChildren, useImperativeHandle, useReducer } from 'react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import REActions from '../../actions/REActions';
import Mark, { MarkProps } from './Mark';
import { selectionIsBackwards, selectionIsEmpty, splitTokensWithOffsets } from './utils';

const s = require('./TokenAnnotator.module.css');

interface TokenProps {
  i: number;
  content: string;
  // selectedText: any,
  // tagModal: JSX.Element | null
  noSpaceAfter?: boolean;
}

interface TokenSpan {
  start: number;
  end: number;
  tokens: string[];
}

let rightDist = 0;

const Token = React.memo((props: PropsWithChildren<TokenProps>) => {
  const [tagModalShow, setTagModalShow] = useState(null);

  const annotationTagModalForce = (i1, tagModal1) => {
    setTagModalShow(props.i == i1 ? tagModal1 ?? null : null);
  };

  useEffect(() => {
    let unR = REActions.annotationTagModalForce.listen(annotationTagModalForce);
    return () => {
      unR();
    };
  }, [props.i]);

  const renderText = useMemo(() => {
    if (props.content == null) {
      return props.content;
    }

    if (props.content === '\n') {
      return <br />;
    }

    if (props.content.indexOf('\n') > -1) {
      let cc = props.content.split('\n');
      let res = [];
      cc.some((c1, c1ind) => {
        if (c1ind > 0) {
          res.push(<br />);
        }
        res.push(c1);
      });
      return res;
    } else {
      return props.content;
    }
  }, [props.content]);

  return (
    <span className={s.tokenAnnotator} data-i={props.i}>
      {renderText}
      {props.noSpaceAfter ? null : ' '}
      <span style={{ position: 'absolute', top: '100%', ...(rightDist > 450 && { left: 0 }), ...(rightDist <= 450 && { right: '100%' }) }}>{tagModalShow}</span>
    </span>
  );
});

export interface TokenAnnotatorProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tokens: string[];
  value: T[];
  onChange: (value: T[]) => any;
  getSpan?: (span: TokenSpan) => T;
  rendermark?: (props: MarkProps) => JSX.Element;
  selectedText: any;
  tagModal: JSX.Element | null;

  // TODO: determine whether to overwrite or leave intersecting ranges.
}

const TokenAnnotator = React.memo(
  React.forwardRef((props: PropsWithChildren<TokenAnnotatorProps<any>>, ref: any) => {
    const { tokens, tagModal, selectedText, value, onChange, rendermark: renderMark, getSpan: _, ...divProps } = props;

    const [showFirstWordsNum, setShowFirstWordsNum] = useState(null);
    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

    const pageSize = 4000;

    const findNextPageWords = useCallback(() => {
      if (tokens == null) {
        return;
      }

      setShowFirstWordsNum((num) => {
        if (num >= tokens?.length) {
          return num;
        }

        let ind = (num == null ? 0 : num + 1) ?? 0;
        let maxPage = ind + pageSize;
        let max = maxPage + pageSize;
        let lastNewLine = null;
        while (ind < tokens?.length && ind < max) {
          let s1 = tokens?.[ind];
          if (s1 === '\n') {
            lastNewLine = ind;
          }

          ind++;

          //use pagesize first ... continue another pageSize just in case
          if (ind >= maxPage && lastNewLine != null) {
            break;
          }
        }
        if (ind >= tokens?.length) {
          lastNewLine = ind + 1;
        }
        if (lastNewLine != null) {
          num = lastNewLine + 1;
        }

        return num;
      });
    }, [tokens]);

    useEffect(() => {
      setShowFirstWordsNum(null);
      setTimeout(() => {
        findNextPageWords();
      }, 0);
    }, [tokens]);

    const rendermark = useCallback(
      (props) => {
        if (renderMark != null) {
          return renderMark(props);
        } else {
          return <Mark {...props} />;
        }
      },
      [renderMark],
    );

    const getSpan = (span: TokenSpan): any => {
      if (props.getSpan) return props.getSpan(span);
      return { start: span.start, end: span.end };
    };

    const handleMouseUp = (e) => {
      if (!props.onChange) return;

      const selection = window.getSelection();

      if (selectionIsEmpty(selection)) return;

      if (!selection.anchorNode.parentElement.hasAttribute('data-i') || !selection.focusNode.parentElement.hasAttribute('data-i')) {
        window.getSelection().empty();
        return false;
      }

      let start = parseInt(selection.anchorNode.parentElement.getAttribute('data-i'), 10);
      let end = parseInt(selection.focusNode.parentElement.getAttribute('data-i'), 10);

      if (selectionIsBackwards(selection)) {
        [start, end] = [end, start];
      }

      rightDist = e.view?.innerWidth - e.clientX;

      end += 1;

      props.onChange?.([...props.value, getSpan({ start, end, tokens: props.tokens?.slice(start, end) })]);
      window.getSelection().empty();
    };

    const handleSplitClick = ({ start, end }) => {
      // Find and remove the matching split.
      const splitIndex = props.value.findIndex((s) => s.start === start && s.end === end);
      if (splitIndex >= 0) {
        props.onChange([...props.value.slice(0, splitIndex), ...props.value.slice(splitIndex + 1)]);
      }
    };

    const splits = useMemo(() => {
      return splitTokensWithOffsets(tokens, value);
    }, [tokens, value]);

    const content1 = useMemo(() => {
      return splits?.map((split, i) => {
        let currentSplit = split;

        if (split.mark) {
          return rendermark({
            key: `${split.start}-${split.end}`,
            ...split,
            onClick: handleSplitClick,
          });
        } else {
          return <Token key={split.i} {...currentSplit} />;
        }
      });
    }, [splits, rendermark]);

    const tagModalLastSent = useRef({});

    useEffect(() => {
      tagModalLastSent.current = {};
    }, [tokens]);

    useEffect(() => {
      tagModalLastSent.current ??= {};

      splits?.some((s1) => {
        if (s1?.mark) {
          //
        } else {
          let tagModalSel = selectedText?.length && selectedText[selectedText.length - 1].end === s1.i + 1 && tagModal ? tagModal : null;

          if (tagModalLastSent.current[s1.i] != tagModalSel) {
            REActions.annotationTagModalForce(s1.i, tagModalSel);
          }
          tagModalLastSent.current[s1.i] = tagModalSel;
        }
      });
    }, [splits, tagModal, selectedText]);

    const { contentRender1, isMoreTextThere } = useMemo(() => {
      if (content1 == null) {
        return null;
      }

      let res = content1?.slice(0, showFirstWordsNum ?? 0);

      let isMoreTextThere = false;
      if (content1?.length > showFirstWordsNum) {
        isMoreTextThere = true;
      }

      return { contentRender1: res, isMoreTextThere };
    }, [content1, showFirstWordsNum]);

    useImperativeHandle(
      ref,
      () => ({
        cbMoreNeeded: () => {
          findNextPageWords();
        },
      }),
      [findNextPageWords],
    );

    return (
      <div
        css={`
          white-space: pre;
          font-family: monospace;
        `}
        {...divProps}
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onMouseUp={handleMouseUp}
      >
        {contentRender1}
      </div>
    );
  }),
);

export default TokenAnnotator;
