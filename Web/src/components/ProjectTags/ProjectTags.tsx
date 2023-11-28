import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form } from 'antd';
import Button from 'antd/lib/button';
import * as React from 'react';
import { connect } from 'react-redux';
import { TagCloud } from 'react-tagcloud';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { memProjectById } from '../../stores/reducers/projects';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectReactExt from '../SelectReactExt/SelectReactExt';
const s = require('./ProjectTags.module.css');
const sd = require('../antdUseDark.module.css');

interface IProjectTagsProps {
  paramsProp?: any;
  projects?: any;
  optionTags?: any;
}

interface IProjectTagsState {
  projectTags?: any;
  optionTags?: any;
  dropdownVisible?: any;
}

class ProjectTags extends React.PureComponent<IProjectTagsProps, IProjectTagsState> {
  private textLength = 30;

  constructor(props) {
    super(props);
    let { projects, paramsProp } = this.props;

    let projectId = paramsProp?.get('projectId');
    let projectFound1 = this.memProjectId(false)(projectId, this.props.projects);

    this.state = {
      projectTags: projectFound1.tags,
      optionTags: [],
    };
  }

  componentDidMount() {
    this.getOptionsTags();
  }

  componentWillUnmount() {}

  componentDidUpdate(prevProps: Readonly<IProjectTagsProps>, prevState: Readonly<IProjectTagsState>, snapshot?: any) {}

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onSaveTags = (values) => {
    let updated_tags = values.tags;
    let projectId = this.props.paramsProp?.get('projectId');
    REClient_.client_().removeProjectTags(projectId, this.state.projectTags ?? [], (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.getProjectsById_(projectId);
      }
    });
    REClient_.client_().addProjectTags(projectId, updated_tags ?? [], (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.getProjectsById_(projectId);
      }
    });
    this.setState({
      projectTags: updated_tags,
    });
    this.toggleDropdown();
  };

  memProjectsList = memoizeOneCurry((doCall, projects) => {
    if (projects) {
      let res = projects.get('list');
      return res;
    }
  });

  getOptionsTags() {
    REClient_.client_()._listProjectsTags(undefined, undefined, undefined, (err, res) => {
      if (res?.result?.tags) {
        const tagList = res?.result?.tags;
        this.setState({
          optionTags:
            tagList?.map((s1) => ({
              label: s1,
              value: s1,
            })) ?? [],
        });
      } else {
        this.setState({
          optionTags: [],
        });
      }
    });
  }

  toggleDropdown = () => {
    this.setState((prevState) => ({
      dropdownVisible: !prevState.dropdownVisible,
    }));
  };

  tagRenderer = (tag, size) => {
    return (
      <span key={tag.value} className={s.tagContent}>
        <span
          key={'sp' + tag.value}
          style={{
            backgroundColor: '#38BFA1',
            color: 'white',
          }}
          className={`tag-${size} ${s.mainTag}`}
        >
          {tag?.value?.length > this.textLength ? `${tag?.value.substring(0, this.textLength)}...` : tag?.value}
        </span>
      </span>
    );
  };

  render() {
    let projectTags =
      this.state.projectTags?.map?.((s1) => ({
        label: s1,
        value: s1,
      })) ?? [];

    return (
      <div style={{ position: 'relative', marginTop: '10px', marginBottom: '20px' }}>
        <div className={sd.titleTopHeaderAfter} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20 }}>
          <span style={{ fontSize: '16px' }}>Project Tags: </span>
          <div className={s.tagCloud} style={{ marginLeft: '15px', marginRight: '0px' }}>
            <TagCloud
              css={`
                display: flex;
                align-items: center;
                flex-wrap: wrap;
              `}
              minSize={14}
              maxSize={30}
              tags={projectTags}
              shuffle={false}
              renderer={this.tagRenderer}
            />
          </div>
          <FontAwesomeIcon
            css={`
              opacity: 0.4;
              &:hover {
                opacity: 1;
              }
            `}
            icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit}
            transform={{ size: 10, x: -3, y: 0 }}
            style={{ color: 'white', cursor: 'pointer' }}
            onClick={this.toggleDropdown}
          />
        </div>
        <div
          css={`
            & #tags {
              color: white;
            }
          `}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '10px',
              }}
            ></div>
            {this.state.dropdownVisible && (
              <Form name="myForm" initialValues={{ tags: this.state.projectTags }} onFinish={this.onSaveTags} style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                <Form.Item
                  name="tags"
                  style={{ marginBottom: '10px', marginRight: '10px' }}
                  hasFeedback
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Tags:
                      <HelpIcon id={'projects_add_tags'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectReactExt placeholder={'Project Tags'} allowCreate allowReOrder mode={'multiple'} allowClear options={this.state.optionTags} />
                </Form.Item>
                <Form.Item style={{ marginBottom: '10px' }}>
                  <Button type={'primary'} style={{ height: '30px', padding: '0 16px' }} htmlType="submit">
                    Save Tags
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    optionTags: state.optionTags,
  }),
  null,
)(ProjectTags);
