import * as am4core from '@amcharts/amcharts4/core';
import am4themes_dark from '@amcharts/amcharts4/themes/dark';
import am4themes_light from '@amcharts/amcharts4/themes/moonrisekingdom';
import * as React from 'react';
import { connect } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { memoizeOneCurry } from '../../libs/memoizeOne';
import { calcProjectByIdIsRefreshing, memProjectById } from '../../stores/reducers/projects';
import DatasetsList from '../DatasetsList/DatasetsList';
import DeploymentsList from '../DeploymentsList/DeploymentsList';
import FeatureGroupsList from '../FeatureGroupsList/FeatureGroupsList';
import ModelMonitorsList from '../ModelMonitorsList/ModelMonitorsList';
import ModelsList from '../ModelsList/ModelsList';
import NanoScroller from '../NanoScroller/NanoScroller';
import ProjectDashboardSteps from '../ProjectDashboardSteps/ProjectDashboardSteps';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./ProjectDetail.module.css');
const sd = require('../antdUseDark.module.css');

interface IProjectDetailProps {
  paramsProp?: any;
  projects?: any;
  models?: any;
  datasets?: any;
  deployments?: any;
  authUser?: any;
}

interface IProjectDetailState {}

class ProjectDetail extends React.PureComponent<IProjectDetailProps, IProjectDetailState> {
  private unDark: any;
  private isM: boolean;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);

    am4core.unuseAllThemes();
    am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);
  }

  componentWillUnmount() {
    this.unDark();

    this.isM = false;
  }

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
  };

  componentDidUpdate(prevProps: Readonly<IProjectDetailProps>, prevState: Readonly<IProjectDetailState>, snapshot?: any) {
    this.doMem();
  }

  onDarkModeChanged = (isDark) => {
    am4core.unuseAllThemes();
    am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);

    // setTimeout(() => {
    //   this.setState({
    //     chartsUuid: uuid.v1(),
    //   });
    // }, 0);

    this.forceUpdate();
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  render() {
    let { projects, paramsProp } = this.props;

    let projectId = paramsProp?.get('projectId');
    let projectFound1 = this.memProjectId(false)(projectId, this.props.projects);

    const isDrift = projectFound1?.isDrift;
    const isPnp = projectFound1?.isPnp;
    const isFeatureStore = projectFound1?.isFeatureStore;

    if (!projectFound1) {
      if (projects) {
        if (calcProjectByIdIsRefreshing(projectId) === 0) {
          return <RefreshAndProgress errorMsg={'Project not found'}></RefreshAndProgress>;
        } else {
          return <RefreshAndProgress isMsgAnimRefresh msgMsg={'Finding Project Information'}></RefreshAndProgress>;
        }
      }
    }

    return (
      <div className={sd.absolute} style={{ color: Utils.isDark() ? 'white' : 'black', margin: '20px 20px' }}>
        <NanoScroller onlyVertical>
          <div style={{ margin: '0 20px' }}>
            <div style={{ position: 'relative' }}>
              <ProjectDashboardSteps projectId={projectId} />
            </div>

            {!isPnp && (
              <div style={{ position: 'relative', marginTop: '50px' }}>
                <DatasetsList isSmall />
              </div>
            )}

            <div style={{ position: 'relative', margin: '50px 25px 0' }}>
              <FeatureGroupsList showTitle />
            </div>

            {!isFeatureStore && !isDrift && (
              <div style={{ position: 'relative', marginTop: '50px' }}>
                <ModelsList isSmall />
              </div>
            )}

            {!isFeatureStore && !isDrift && (
              <div style={{ position: 'relative', marginTop: '50px' }}>
                <DeploymentsList isSmall />
              </div>
            )}

            {isDrift && (
              <div style={{ position: 'relative', marginTop: '50px' }}>
                <ModelMonitorsList isSmall />
              </div>
            )}

            <div
              css={`
                margin-top: 50px;
              `}
            >
              &nbsp;
            </div>
          </div>
        </NanoScroller>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    models: state.models,
    datasets: state.datasets,
    deployments: state.deployments,
    authUser: state.authUser,
  }),
  null,
)(ProjectDetail);
