import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./DockerAddNew.module.css');
const sd = require('../antdUseDark.module.css');

interface IDockerAddNewProps {}

const DockerAddNew = React.memo((props: PropsWithChildren<IDockerAddNewProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSubmit = (values) => {
    setIsRefreshing(true);
    REClient_.client_().createModelFromDockerImage(projectId, values.location, values.port, values.name, (err, res) => {
      setIsRefreshing(false);

      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let modelId = res?.result?.modelId;

        StoreActions.getProjectsById_(projectId);
        StoreActions.listModels_(projectId);

        StoreActions.refreshDoModelAll_(modelId, projectId);

        Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
      }
    });
  };

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <RefreshAndProgress isRelative isMsgAnimRefresh={true} msgHideContent={true} msgMsg={isRefreshing ? 'Processing...' : null}>
        <FormExt
          layout={'vertical'}
          onFinish={handleSubmit}
          initialValues={{
            name: '',
            location: '',
            port: 8901,
          }}
        >
          <div style={{ maxWidth: '940px', margin: '46px auto 120px auto', padding: '0 20px', color: 'white' }}>
            <div>
              <img src={calcImgSrc('/imgs/dataset_usecase_upload.png')} alt={''} style={{ width: '130px' }} />
            </div>

            <div style={{ marginTop: '36px', fontFamily: 'Matter', fontSize: '26px', lineHeight: 1.39 }}>{'Create Dockerized Model'}</div>
            <div
              css={`
                font-family: Matter;
                font-size: 18px;
                text-align: center;
                opacity: 0.8;
                margin: 15px auto;
                max-width: 600px;
              `}
            >
              Provide the URI for the Docker Image as well as the service port that your containerized model service is listening to.
            </div>

            <div
              css={`
                width: 500px;
                margin: 0 auto;
              `}
            >
              <Form.Item
                name={'name'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Name:
                    <HelpIcon id={'docker_name'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name={'location'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Location:
                    <HelpIcon id={'docker_location'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input style={{ width: '100%' }} />
              </Form.Item>
              <div
                css={`
                  width: 140px;
                  margin: 0 auto;
                `}
              >
                <Form.Item
                  name={'port'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Port:
                      <HelpIcon id={'docker_port'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <InputNumber min={1} max={10000000} step={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </div>

            <div style={{ marginTop: '30px' }}></div>

            <div style={{ marginTop: '40px' }}>
              <div style={{ maxWidth: '450px', margin: '0 auto' }}>
                <Button htmlType={'submit'} style={{ width: '100%' }} type={'primary'}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        </FormExt>
      </RefreshAndProgress>
    </div>
  );
});

export default DockerAddNew;
