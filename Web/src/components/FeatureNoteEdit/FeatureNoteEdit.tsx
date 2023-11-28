import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
const s = require('./FeatureNoteEdit.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureNoteEditProps {
  projectId?: string;
  featureGroupId?: string;
  feature?: string;

  onClose?: () => void;
}

const FeatureNoteEdit = React.memo((props: PropsWithChildren<IFeatureNoteEditProps>) => {
  const { paramsProp, authUser, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');

  const changedNote = useRef(false);
  const changedTags = useRef(false);

  useEffect(() => {
    changedNote.current = false;
    changedTags.current = false;
  }, []);

  const featuresOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, props.projectId, props.featureGroupId);
  }, [featureGroupsParam, props.featureGroupId, props.projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, props.projectId, props.featureGroupId);
  }, [featureGroupsParam, props.featureGroupId, props.projectId]);

  useEffect(() => {
    let note1 = featuresOne?.columnNotes?.[props.feature];
    setNote(note1 ?? '');

    let tags1 = featuresOne?.featureTags?.[props.feature] as string[];
    setTags(tags1?.join(', ') ?? '');
  }, [featuresOne, props.feature]);

  const onClickCancel = (e) => {
    props.onClose?.();
  };

  const onClickSave = (e) => {
    const doWorkNote = (cbFinish?) => {
      if (!changedNote.current) {
        cbFinish?.(true);
        return;
      }

      REClient_.client_()._setFeatureNote(props.featureGroupId, props.feature, note, (err, res) => {
        if (err || !res?.success) {
          cbFinish?.(false);
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          cbFinish?.(true);
        }
      });
    };
    const doWorkTags = (cbFinish?) => {
      if (!changedTags.current) {
        cbFinish?.(true);
        return;
      }

      REClient_.client_()._setFeatureTags(
        props.featureGroupId,
        props.feature,
        (tags ?? '').split(',').map((s1) => _.trim(s1)),
        (err, res) => {
          if (err || !res?.success) {
            cbFinish?.(false);
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            cbFinish?.(true);
          }
        },
      );
    };

    doWorkNote((isOk) => {
      if (isOk) {
        doWorkTags((isOk) => {
          if (isOk) {
            REActions.addNotification('Done!');

            StoreActions.featureGroupsDescribe_(null, props.featureGroupId);
            if (props.projectId) {
              StoreActions.featureGroupsDescribe_(props.projectId, props.featureGroupId);
            }
            StoreActions.schemaGetFileFeatureGroup_(props.projectId, props.featureGroupId);

            props.onClose?.();
          }
        });
      }
    });
  };

  const onChangeNote = (e) => {
    setNote(e.target.value);
    changedNote.current = true;
  };

  const onChangeTags = (e) => {
    setTags(e.target.value);
    changedTags.current = true;
  };

  const onMouseDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onMouseDown={onMouseDown}
      css={`
        color: white;
      `}
    >
      <Input.TextArea value={note} onChange={onChangeNote} style={{ width: '300px', height: '160px', resize: 'none' }} />
      <div
        css={`
          display: flex;
          margin-top: 5px;
          align-items: center;
        `}
      >
        <div css={``}>Tags:</div>
        <div
          css={`
            margin-left: 5px;
            flex: 1;
            & .ant-input {
              width: 100%;
            }
          `}
        >
          <Input value={tags} onChange={onChangeTags} />
        </div>
      </div>
      <div
        css={`
          font-size: 11px;
          text-align: center;
          opacity: 0.7;
        `}
      >
        Comma separated tags
      </div>
      <div
        css={`
          margin-top: 12px;
          text-align: center;
        `}
      >
        <Button onClick={onClickCancel} size={'small'}>
          Cancel
        </Button>
        <Button
          onClick={onClickSave}
          size={'small'}
          type={'primary'}
          css={`
            margin-left: 10px;
          `}
        >
          Save
        </Button>
      </div>
    </div>
  );
});

export default FeatureNoteEdit;
