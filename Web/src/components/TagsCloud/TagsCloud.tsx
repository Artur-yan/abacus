import _ from 'lodash';
import React, { forwardRef, useMemo } from 'react';
import classNames from 'classnames';
import { TagCloud } from 'react-tagcloud';
import { TagsCloudInterface, TagOption } from './types';
import styles from './TagsCloud.module.css';
import globalStyles from '../antdUseDark.module.css';

const TagsCloud = forwardRef(({ minSize = 14, maxSize = 30, tags = [], shuffle = false, onTagSelect = () => {}, selectedTag, containerRef }: TagsCloudInterface, ref2) => {
  const textLength = 30;
  const customRenderer = (tag, size) => {
    return (
      <span key={tag.value} className={styles.tagContent}>
        <span
          onClick={() => onTagSelect(tag?.value === selectedTag?.value ? null : tag)}
          key={'sp' + tag.value}
          style={{
            backgroundColor: `${selectedTag?.value === tag?.value ? '#38BFA1' : '#e0e0e0'}`,
            color: `${selectedTag?.value === tag?.value ? 'white' : 'black'}`,
          }}
          className={`tag-${size} ${styles.mainTag}`}
        >
          {tag?.value?.length > textLength ? `${tag?.value.substring(0, textLength)}...` : tag?.value}
          {selectedTag?.value === tag?.value && <span className={`${styles.tagX}`}>&#10005;</span>}
        </span>
      </span>
    );
  };

  const hasTags = (tags?.length ?? 0) > 0;
  if (!hasTags) {
    return <span></span>;
  }

  return (
    <div ref={containerRef} className={classNames(styles.tagCloudContainer, globalStyles.grayPanel)}>
      <div className={styles.header}>
        Filter by Tags:
        {selectedTag && (
          <span className={styles.selectedTag}>
            <b>
              <i>{selectedTag.value}</i>
            </b>
            <span onClick={() => onTagSelect(null)} className={styles.clearButton}>
              Clear
            </span>
          </span>
        )}
      </div>
      <TagCloud className={styles.tagCloud} minSize={minSize} maxSize={maxSize} tags={tags} shuffle={shuffle} renderer={customRenderer} />
    </div>
  );
});

export default TagsCloud;
