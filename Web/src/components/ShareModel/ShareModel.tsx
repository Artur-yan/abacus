import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as Immutable from 'immutable';
import $ from 'jquery';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import datasetsReq, { calcDataset_datasetType, DatasetLifecycle } from '../../stores/reducers/datasets';
import { calcModelDetailListByProjectId } from '../../stores/reducers/models';
import projectDatasets from '../../stores/reducers/projectDatasets';
import FormExt from '../FormExt/FormExt';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./ShareModel.module.css');
const sd = require('../antdUseDark.module.css');

interface IShareModelProps {}

const ShareModel = React.memo((props: PropsWithChildren<IShareModelProps>) => {
  const { paramsProp, modelsParam, datasetsParam, projectDatasetsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    modelsParam: state.models,
    datasetsParam: state.datasets,
    projectDatasetsParam: state.projectDatasets,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [form] = Form.useForm();

  const modelId = paramsProp?.get('modelId');
  const projectId = paramsProp?.get('projectId');

  useEffect(() => {
    projectDatasets.memDatasetsByProjectId(true, undefined, projectId);
  }, [projectDatasetsParam]);
  const listDatasetsAllInProject = useMemo(() => {
    return projectDatasets.memDatasetsByProjectId(false, undefined, projectId);
  }, [projectDatasetsParam]);

  const memDatasetsList = (doCall, datasets, listDatasets) => {
    if (listDatasets) {
      let ids = listDatasets.map((d1) => d1.dataset?.datasetId);
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  };

  useEffect(() => {
    memDatasetsList(true, datasetsParam, listDatasetsAllInProject);
  }, [datasetsParam, listDatasetsAllInProject]);
  const listDatasetsAll = useMemo(() => {
    return memDatasetsList(false, datasetsParam, listDatasetsAllInProject);
  }, [datasetsParam, listDatasetsAllInProject]);

  const listDatasets: { publicUrl; dataSource; datasetId; name; datasetType; status }[] = useMemo(() => {
    let res = [];
    if (!listDatasetsAll) {
      return res;
    }

    let listDatasets = listDatasetsAll;
    if (Utils.isNullOrEmpty(projectId)) {
      listDatasets = [];
    }

    Object.values(listDatasets).some((d1: Immutable.Map<string, any>) => {
      let datasetId = d1.getIn(['dataset', 'datasetId']);
      let status1 = d1.getIn(['status']);

      if ([DatasetLifecycle.COMPLETE].includes(status1 as any)) {
        res.push({
          datasetId: datasetId,
          name: d1.getIn(['dataset', 'name']),
          datasetType: calcDataset_datasetType(d1, projectId),
          status: status1,
          dataSource: d1.get('dataSource'),
          publicUrl: d1.get('publicUrl'),
        });
      }
    });

    res = res.sort((a, b) => {
      return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    });

    return res;
  }, [listDatasetsAll, projectId]);

  useMemo(() => {
    if (listDatasets) {
      let values = [];
      listDatasets.some((d1, d1ind) => {
        let url1 = d1.publicUrl || '';
        values.push({ name: 'datasetName' + d1ind, value: url1 });
      });

      if (values.length > 0) {
        setTimeout(() => {
          form.setFields(values);
        }, 0);
      }
    }
  }, [listDatasets]);

  const memModelDetail = (doCall, models, modelId) => {
    if (models && modelId) {
      let res = calcModelDetailListByProjectId(undefined, modelId);
      if (res == null) {
        if (models.get('isRefreshing')) {
          return null;
        } else {
          if (doCall) {
            StoreActions.getModelDetail_(modelId);
          }
        }
      } else {
        return res;
      }
    }
  };
  useEffect(() => {
    memModelDetail(true, modelsParam, modelId);
  }, [modelsParam, modelId]);
  const modelDetail1 = useMemo(() => {
    return memModelDetail(false, modelsParam, modelId);
  }, [modelsParam, modelId]);

  useMemo(() => {
    const name1 = modelDetail1?.get('name');
    if (!Utils.isNullOrEmpty(name1)) {
      setTimeout(() => {
        form.setFields([{ name: 'name', value: name1 }]);
      }, 0);
    }
  }, [modelDetail1?.get('name')]);

  const handleSubmit = (values) => {
    const name = values.name;
    const desc = values.desc;

    let modelId = paramsProp?.get('modelId');
    let projectId = paramsProp?.get('projectId');

    if (!modelId || !projectId) {
      REActions.addNotificationError(Constants.errorDefault);
      return;
    }
    REClient_.client_()._shareModel(modelId, name, desc, (err, res) => {
      if (err) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let pp = [];
        const addPP = (datasetId, url) => {
          pp.push(
            new Promise((resolve, reject) => {
              REClient_.client_()._setDatasetPublicSource(datasetId, url, (err, res) => {
                if (err) {
                  Utils.error(err);
                }
                resolve(null);
              });
            }),
          );
        };
        listDatasets?.some((d1, d1ind) => {
          let url1 = values['datasetName' + d1ind];
          if (!Utils.isNullOrEmpty(url1)) {
            addPP(d1.datasetId, url1);
          }
        });

        const doDoneEnd = () => {
          REActions.addNotification('Done!');

          StoreActions.getProjectsList_();
          StoreActions.listDatasets_(listDatasets?.map((d1) => d1?.datasetId));
          StoreActions.getProjectsById_(projectId);
          StoreActions.getModelDetail_(modelId);
          StoreActions.listModels_(projectId);
        };

        const doDone = () => {
          if (cropChanged) {
            getCroppedImg(imageUsed, crop, 'thumbnail.png').then((blob) => {
              REClient_.client_()._uploadModelImage(modelId, blob, (err, res) => {
                if (err || !res.success) {
                  REActions.addNotificationError(err || Constants.errorDefault);
                }

                doDoneEnd();
              });
            });
          } else {
            doDoneEnd();
          }
        };

        if (pp.length === 0) {
          doDone();
        } else {
          Promise.all(pp).then((res) => {
            doDone();
          });
        }
      }
    });
  };

  const [crop, setCrop] = useState({ aspect: 1, width: 100, unit: '%', x: 0, y: 0 });
  const [srcImg, setSrcImg] = useState(null);
  const [imageUsed, setImageUsed] = useState(null);
  const [cropChanged, setCropChanged] = useState(false);
  const [defaultImg, setDefaultImg] = useState(null);

  useEffect(() => {
    REClient_.client_()._getDefaultModelImage(modelId, (err, res) => {
      if (res?.result) {
        setDefaultImg(res.result);
        setSrcImg(res.result);
      }
    });
  }, [modelId]);

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width * scaleX, crop.height * scaleY);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          // @ts-ignore
          blob.name = fileName;
          resolve(blob);
        },
        'image/png',
        1,
      );
    });
  };

  const cbAfterLoadImg = useRef(null);
  const onImageLoaded = (image) => {
    setImageUsed(image);

    let c1: any = { aspect: 1, unit: '%' };
    let ww = Math.min(image.width, image.height);

    if (image.width <= image.height) {
      c1.width = 100;
      c1.y = ((image.height - image.width) / 2 / image.height) * 100;
    } else {
      c1.x = ((image.width - image.height) / 2 / image.width) * 100;
      c1.height = 100;
    }

    setCrop(c1);
    setTimeout(() => {
      setCropChanged(false);
      cbAfterLoadImg.current?.();
    }, 0);

    return false;
  };

  const fileRef = useRef(null);
  const onClickAvatarFile = (e) => {
    $(fileRef.current).trigger('click');
  };
  const onChangeFile = (e) => {
    let img = URL.createObjectURL(e.target.files[0]);
    cbAfterLoadImg.current = () => {
      setCropChanged(true);
    };
    setCropChanged(true);
    setSrcImg(img);
  };
  const onClickAvatarReset = (e) => {
    if (defaultImg) {
      cbAfterLoadImg.current = null;
      if (srcImg === defaultImg) {
        if (imageUsed) {
          onImageLoaded(imageUsed);
        }
      } else {
        setSrcImg(defaultImg);
      }
    }
  };

  const onNewCrop = (newCrop) => {
    if (!newCrop) {
      return;
    }
    if (newCrop.width <= 0 || newCrop.height <= 0) {
      return;
    }
    setCrop(newCrop);
  };

  return (
    <div>
      <div style={{ margin: '30px auto', maxWidth: '700px', color: Utils.colorA(1) }}>
        <RefreshAndProgress isRelative>
          <Card
            title={
              <span
                css={`
                  font-family: Matter;
                  font-size: 24px;
                  line-height: 32px;
                  color: #ffffff;
                `}
              >
                Share with Community
              </span>
            }
            headStyle={{ color: 'white' }}
            style={{ color: 'white', boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '0px solid ', borderRadius: '5px' }}
            className={sd.grayPanel}
          >
            <div
              css={`
                font-family: Matter;
                font-size: 14px;
                color: #d1e4f5;
                margin-bottom: 20px;
                text-align: center;
              `}
            >
              By sharing the model with the community, you are publishing this model online. Community members will be able to take a look at your model and model metrics and make comments
            </div>

            <div style={{ display: 'flex' }}>
              <div style={{ flex: '0 0 200px', textAlign: 'center', marginRight: '20px' }}>
                <ReactCrop
                  /* @ts-ignore */
                  src={srcImg}
                  crop={crop as any}
                  onChange={onNewCrop}
                  onImageLoaded={onImageLoaded}
                  crossorigin={'Anonymous'}
                  onComplete={() => {
                    setCropChanged(true);
                  }}
                />
                <div style={{ fontSize: '14px', marginTop: '10px', color: Utils.colorA(1) }}>Thumbnail</div>
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <input type={'file'} ref={fileRef} onChange={onChangeFile} style={{ display: 'none' }} />
                  <Button type={'primary'} ghost onClick={onClickAvatarFile}>
                    Choose...
                  </Button>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <Button type={'default'} ghost onClick={onClickAvatarReset}>
                    Reset
                  </Button>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <FormExt layout={'vertical'} form={form} onFinish={handleSubmit}>
                  <Form.Item name={'name'} label={<span style={{ color: Utils.colorA(1) }}>NAME OF MODEL</span>}>
                    <Input placeholder={'enter 1-2 sentence describing what your model does'} />
                  </Form.Item>
                  <Form.Item name={'desc'} label={<span style={{ color: Utils.colorA(1) }}>DESCRIPTION</span>}>
                    <Input.TextArea style={{ height: '90px' }} />
                  </Form.Item>
                  {listDatasets != null && listDatasets.length > 0 && <div style={{ color: Utils.colorA(1), fontSize: '14px', marginBottom: '1px', marginTop: '36px' }}>{'Public URL for Datasets Used (Optional)'.toUpperCase()}</div>}
                  {listDatasets?.map((d1, d1ind) => {
                    return (
                      <div style={{ color: Utils.colorA(1) }}>
                        <div style={{ marginTop: '6px', marginBottom: '4px' }}>
                          <span style={{ color: Utils.colorA(0.8) }}>{d1.name}</span>
                        </div>
                        <Form.Item
                          style={{ marginTop: 0, paddingTop: 0, marginBottom: '12px' }}
                          key={'ds_url_' + d1ind}
                          name={'datasetName' + d1ind}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(rule, value) {
                                if (!value) {
                                  return Promise.resolve();
                                }
                                if (!_.startsWith(value?.toLowerCase() || '', 'http://') && !_.startsWith(value?.toLowerCase() || '', 'https://')) {
                                  return Promise.reject('Invalid location prefix!');
                                } else {
                                  return Promise.resolve();
                                }
                              },
                            }),
                          ]}
                        >
                          <Input placeholder={'https://'} />
                        </Form.Item>
                      </div>
                    );
                  })}

                  <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                    <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '0 -22px' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <Button type={'default'} ghost htmlType="submit" style={{ borderColor: Constants.devCenterColor, color: Constants.devCenterColor, marginTop: '16px', width: '100%' }}>
                        Share with Community
                      </Button>
                    </div>
                  </Form.Item>
                </FormExt>
              </div>
            </div>
          </Card>
        </RefreshAndProgress>
      </div>
    </div>
  );
});

export default ShareModel;
