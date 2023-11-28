import Button from 'antd/lib/button';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import LeftOutlined from '@ant-design/icons/LeftOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import SelectExt from '../SelectExt/SelectExt';
import NanoScroller from '../NanoScroller/NanoScroller';
import { calcFieldValuesByDeployId } from '../../stores/reducers/projects';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

const { TextArea } = Input;

interface IModelPredictionsStableDiffusionOneProps {
  deploymentId?: string;
}

const s = require('./ModelPredictionsStableDiffusionOne.module.css');

const ModelPredictionsStableDiffusionOne = React.memo(
  React.forwardRef((props: PropsWithChildren<IModelPredictionsStableDiffusionOneProps>, ref: any) => {
    const [sideWidth, setSideWidth] = React.useState(200);
    const [model, setModel] = React.useState(null);
    const [theme, setTheme] = React.useState(null);
    const [seed, setSeed] = React.useState(0);
    const [resultImg, setResultImg] = React.useState(null);
    const [promptText, setPromptText] = React.useState('');
    const [history, setHistory] = React.useState([]);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = React.useState(-1);
    const [isRefresh, setIsRefresh] = React.useState(false);

    const listTestData = React.useMemo(() => {
      return calcFieldValuesByDeployId(undefined, props.deploymentId);
    }, [props.deploymentId]);

    const modelOptions = React.useMemo(() => {
      const models = listTestData?.displayInfo?.models;
      if (models?.length > 0) {
        setModel(models?.[0].value);
        return models?.map((item) => ({ ...item }));
      }
    }, [listTestData]);

    const themeOptions = React.useMemo(() => {
      const themes = listTestData?.displayInfo?.themes;
      if (themes?.length > 0) {
        setTheme(themes?.[0].value);
        return themes?.map((item) => ({ ...item }));
      }
    }, [listTestData]);

    const onChangeModel = (option) => {
      setModel(option?.value);
    };

    const onChangeTheme = (option) => {
      setTheme(option?.value);
    };

    const onGenerate = (e) => {
      if (props.deploymentId) {
        setResultImg(null);
        setIsRefresh(true);

        const queryData = {
          prompt: promptText,
          model,
          seed,
          theme,
        };

        REClient_.client_()._generateImage(props.deploymentId, queryData, null, (err, res) => {
          setIsRefresh(false);

          if (err || !res?.success || !res?.result || res?.result?.length < 1024) {
            REActions.addNotificationError('Cannot generate the image.');
            setResultImg(null);
          } else {
            let resString = 'data:image/jpeg;base64,' + res?.result;
            setResultImg(resString);
            setSelectedHistoryIndex(history.length);
            setHistory((prev) => [
              ...prev,
              {
                ...queryData,
                image: resString,
              },
            ]);
          }
        });
      }
    };

    const onHistoryItemClick = (index) => {
      if (history.length > index) {
        const historyItem = history[index];

        setPromptText(historyItem.prompt);
        setModel(historyItem.model);
        setTheme(historyItem.theme);
        setSeed(historyItem.seed);
        setResultImg(historyItem.image);
        setSelectedHistoryIndex(index);
      }
    };

    return (
      <NanoScroller>
        <div css={'display: flex; border-bottom: 1px solid grey;'}>
          <div css={'display: flex; flex-direction: column; flex: 1;'}>
            <div css={'display: flex; align-items: center; gap: 20px; padding: 30px; border-bottom: 1px solid grey;'}>
              <TextArea
                maxLength={200}
                style={{ flex: 1, height: 100 }}
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                }}
                placeholder="Prompt text"
              />
              <Button disabled={promptText === '' || isRefresh} type="primary" onClick={onGenerate}>
                Generate
              </Button>
            </div>
            <div css={'display: flex; flex: 1;'}>
              <div css={'display: flex; padding: 20px; border-right: 1px solid grey;'}>
                <div
                  css={`
                    width: ${sideWidth}px;
                    transition: width 0.5s, visibility 0s;
                    display: ${sideWidth === 200 ? 'block' : 'none'};
                  `}
                >
                  {
                    <div
                      css={`
                        display: flex;
                        flex-direction: column;
                      `}
                    >
                      <div css={'font-size: 16px;'}>Advanced</div>
                      <div css={'margin-top: 20px;'}>
                        <div css={'margin-bottom: 10px;'}>Model</div>
                        <SelectExt value={modelOptions?.find((v1) => v1.value === model)} options={modelOptions} onChange={onChangeModel} />
                      </div>
                      <div css={'margin-top: 20px;'}>
                        <div css={'margin-bottom: 10px;'}>Seed</div>
                        <Input
                          value={seed}
                          onChange={(e) => {
                            if (!isNaN(+e.target.value)) {
                              setSeed(+e.target.value);
                            }
                          }}
                        />
                      </div>
                      <div css={'margin-top: 20px;'}>
                        <div css={'margin-bottom: 10px;'}>Theme</div>
                        <SelectExt value={themeOptions?.find((v1) => v1.value === theme)} options={themeOptions} onChange={onChangeTheme} />
                      </div>
                    </div>
                  }
                </div>
                <div
                  css={`
                    padding-left: ${sideWidth === 200 ? 20 : 0}px;
                  `}
                >
                  {sideWidth === 200 && (
                    <LeftOutlined
                      onClick={() => {
                        setSideWidth(0);
                      }}
                    />
                  )}
                  {sideWidth === 0 && (
                    <RightOutlined
                      onClick={() => {
                        setSideWidth(200);
                      }}
                    />
                  )}
                </div>
              </div>
              <div css={'flex: 1; text-align: center; padding: 70px 20px'}>
                <div style={{ display: 'inline-block', position: 'relative', minWidth: 400, width: 400, height: 400, textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.35)' }}>
                  {resultImg && <img src={resultImg} alt="" width={'100%'} height={'100%'} style={{ position: 'absolute', left: 0, top: 0, objectFit: 'contain' }} />}
                  {resultImg && (
                    <a className={s.hide} download="_stableDiffusion.jpg" href={resultImg}>
                      <DownloadOutlined style={{ zIndex: 10, position: 'relative', fontSize: '21px', margin: '20px', color: 'white' }} />
                    </a>
                  )}
                  {isRefresh && <div style={{ width: '100%', height: '100%', zIndex: 10, position: 'absolute', left: 0, top: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>Generating...</div>}
                </div>
              </div>
            </div>
          </div>
          <div css={'width: 150px; border-left: 1px solid grey; display: flex; flex-direction: column; align-items: center;'}>
            <div css={'font-size: 16px; margin-top: 10px; margin-bottom: 10px;'}>History</div>
            <AutoSizer disableWidth>
              {({ height }) => {
                return (
                  <div style={{ position: 'relative', height: `${height - 60}px`, width: '149px' }}>
                    <NanoScroller>
                      <div css={'padding: 0px 18px;'}>
                        {history.map((item, index) => (
                          <div
                            key={`${item.prompt}-${index}`}
                            className={s.historyItem}
                            css={`
                              border-color: ${index === selectedHistoryIndex ? 'green' : 'transparent'};
                            `}
                          >
                            <img
                              src={item.image}
                              width={'100px'}
                              height={'100px'}
                              style={{ margin: '5px', objectFit: 'contain' }}
                              onClick={(e) => {
                                onHistoryItemClick(index);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </NanoScroller>
                  </div>
                );
              }}
            </AutoSizer>
          </div>
        </div>
      </NanoScroller>
    );
  }),
);

export default ModelPredictionsStableDiffusionOne;
