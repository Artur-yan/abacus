import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { DatasetLifecycle } from '../../stores/reducers/datasets';
import { DeploymentLifecycle } from '../../stores/reducers/deployments';
import { ModelLifecycle } from '../../stores/reducers/models';
import SearchAdvancedFormStatus from '../SearchAdvancedFormStatus/SearchAdvancedFormStatus';
const s = require('./SearchAdvancedForm.module.css');
const sd = require('../antdUseDark.module.css');

interface ISearchAdvancedFormProps {
  onChange?: (v1) => void;
}

const SearchAdvancedForm = React.memo((props: PropsWithChildren<ISearchAdvancedFormProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const styleInput = {
    marginBottom: '7px',
  };

  const [searchFormState, setSearchFormState] = useState(() => {
    let dataSearch = Utils.dataNum('advSearchForm');
    return dataSearch?.['adv'] ?? {};
  });

  const onChangeAdvForm = (v1) => {
    setSearchFormState(v1);
  };

  useEffect(() => {
    let unRe = REActions.onChangeAdvForm.listen(onChangeAdvForm);

    return () => {
      unRe();
    };
  }, []);

  const calcValueForm = (type, fieldName) => {
    let typeData = searchFormState[type];
    if (typeData == null) {
      return null;
    }
    return typeData[fieldName ?? '-'];
  };
  const onChangeForm = (type, fieldName, isValue, e) => {
    let s1 = { ...(searchFormState ?? {}) };

    let typeData = s1[type];
    if (typeData == null) {
      typeData = {};
      s1[type] = typeData;
    } else {
      typeData = { ...typeData };
      s1[type] = typeData;
    }

    typeData[fieldName] = isValue ? e : e.target.value;

    // setSearchFormState(s1);
    props.onChange?.(s1);
  };

  const optionsUseCase = [];

  const enumSort = (enum1) => {
    return Object.keys(enum1).sort();
  };

  const listSearch = [
    {
      type: 'datasets',
      name: 'On Datasets:',
      iconName: 'datasetIcon',
      statusList: enumSort(DatasetLifecycle),
    },
    {
      type: 'models',
      name: 'On Models:',
      iconName: 'modelIcon',
      statusList: enumSort(ModelLifecycle),
    },
    {
      type: 'metrics',
      name: 'On Metrics:',
      iconName: 'modelMetricIcon',
    },
    {
      type: 'deploys',
      name: 'On Deployments:',
      iconName: 'deployIcon',
      statusList: enumSort(DeploymentLifecycle),
    },
  ];

  const onChangeFormStatus = (type0, v1) => {
    onChangeForm(type0, 'status', true, v1);
  };

  return (
    <div>
      {listSearch.map((s1, s1ind) => {
        return (
          <div
            key={'sea_' + s1ind}
            css={`
              display: flex;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              margin-bottom: 8px;
            `}
          >
            <div
              css={`
                font-size: 16px;
                padding-top: 12px;
                margin-right: 15px;
                width: 130px;
                height: 110px;
              `}
            >
              <div>{s1.name}</div>
              <div style={{ marginTop: '10px' }}>
                <img src={calcImgSrc('/imgs/' + s1.iconName + '.png')} alt={''} style={{ width: '25px' }} />
              </div>
            </div>
            <div className={sd.classGrayPanel} style={{ flex: 1, marginBottom: '8px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.07)' }}>
              <Input value={calcValueForm(s1.type, 'name')} onChange={onChangeForm.bind(null, s1.type, 'name', false)} placeholder={'Name'} style={styleInput} />

              {s1.statusList != null && <SearchAdvancedFormStatus value={calcValueForm(s1.type, 'status')} statusList={s1.statusList} type0={s1.type} onChange={onChangeFormStatus.bind(null, s1.type)} />}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default SearchAdvancedForm;
