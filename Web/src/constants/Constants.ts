import _ from 'lodash';
import Utils from '../../core/Utils';

export interface IConfigFlags {
  hide_nb_fast_ui?: boolean;
  annotations_for_usecases_list?: string[];
  hide_eda_plots?: boolean;
  hide_annotations?: boolean;
  hide_prompt?: boolean;
  hide_monitors_changes?: boolean;
  hide_system_templates?: boolean;
  algos?: boolean;
  hide_python_functions?: boolean;
  hide_custom_loss_functions?: boolean;
  hide_custom_metrics?: boolean;
  templates?: boolean;
  register_model2?: boolean;
  cds_too_large?: string;
  onprem?: any;
  drift_metrics?: any;
  raw_data_filters?: any;
  model_drift?: any;
  model_metrics?: any;
  model_metrics_latency_chart?: any;
  hide_consultation?: any;
  show_alerts?: any;
  sla?: any;
  streaming_api_url?: any;
  product_name?: string;
  socialHandlerTwitter?: string;
  socialHandlerGithub?: string;
  socialHandlerLinkedin?: string;
  model_graphs_cache_key?: any;
  largeScreenWW?: number;
  mediumScreenWW?: number;
  smallScreenWW?: number;
  visuals_dataset?: any;
  visual_cron?: any;
  repo_github_model_server?: string;
  read_default_ext?: string;
  hide_model_config_internals?: any;
  files_add_formats?: string;
  tabular_files_add_formats?: string;
  static_domain?: string;
  upload_model_demo?: boolean;
  deploy_fg_demo?: boolean;
  all_fg_demo?: boolean;
  extra_inputs_schema_usecases?: string;
  extra_inputs_fg_demos?: boolean;
  timewindow_demo?: boolean;
  profile_groups_demo?: boolean;
  visual_data_grid?: boolean;
  show_format_sql?: boolean;
  show_fg_explorer?: boolean;
  show_search_top?: boolean;
  show_log_links?: boolean;
}

const Constants = {
  transparentPixelBase64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  itemsPerPage: 30,

  flagPreviewUpload: true,
  ssoClientIds: null as { azure?; github?; google?; okta? },
  ssoClientUrls: null as { okta? },

  ANNOTATING: 'DOCUMENTS',

  errorDefault: 'Something went wrong. Sorry',

  navTopSearchHH: 40,
  devCenterName: 'Model Showcase',
  devCenterColor: '#79cb66',
  domain: 'abacus.ai',
  dev_prefix: 'http://',
  signin_redirect_after: 'signin_redirect_after',
  custom_table: 'CUSTOM_TABLE',
  custom_table_desc: 'Custom Table',
  prediction_metrics_input: 'PREDICTION_METRICS_INPUT',
  prediction_metrics_input_desc: 'Prediction Metrics Input',
  cumulative_usecase: 'CUMULATIVE_FORECASTING',
  clustering_usecase: 'CLUSTERING',
  clustering_timeseries_usecase: 'CLUSTERING_TIMESERIES',
  ai_agent: 'AI_AGENT',
  no_data: 'NO DATA',
  disableAiFunctionalities: false,

  isShowViewLogs: (useCase, hasCustomAlgorithms?: boolean) => ['PYTHON_MODEL'].includes(useCase?.toUpperCase()) || hasCustomAlgorithms === true,

  flags: {
    hide_nb_fast_ui: true,
    annotations_for_usecases_list: ['named_entity_recognition', 'FEATURE_STORE'.toLowerCase()],
    hide_eda_plots: false,
    hide_prompt: false,
    hide_annotations: false,
    hide_monitors_changes: false,
    hide_system_templates: false,
    algos: false,
    hide_python_functions: false,
    hide_custom_loss_functions: false,
    hide_custom_metrics: false,
    templates: false,
    register_model2: true,
    cds_too_large: "Source data is too large. Please start Custom Dataserver to perform accurate queries and filters on this feature group's data",
    onprem: false,
    drift_metrics: false,
    show_search_top: true,
    show_fg_explorer: false,
    show_format_sql: true,
    visual_data_grid: true,
    raw_data_filters: false,
    model_drift: false,
    model_metrics: true,
    model_metrics_latency_chart: true,
    upload_model_demo: false,
    deploy_fg_demo: false,
    files_add_formats: 'We support ZIPs, PDF or text files',
    tabular_files_add_formats: 'Supported file formats are CSV, JSON, XLS, ODS and Parquet',
    read_default_ext: null,
    repo_github_model_server: 'https://github.com/abacusai/notebooks/blob/main/Use%20Cases/Plug%20and%20Play%20Notebook.ipynb',
    visual_cron: false,
    visuals_dataset: false,
    largeScreenWW: 1700,
    mediumScreenWW: 1550,
    smallScreenWW: 1300,
    product_name: 'Abacus.AI',
    show_alerts: false,
    sla: '99.95%',
    streaming_api_url: 'https://static.abacus.ai/sdk/js/streaming.v1.js',
    socialHandlerTwitter: 'https://twitter.com/',
    socialHandlerGithub: 'https://github.com/',
    socialHandlerLinkedin: 'https://www.linkedin.com/in/',
    model_graphs_cache_key: 0,
    hide_model_config_internals: true,
    static_domain: 'https://static.abacus.ai',
    all_fg_demo: false,
    extra_inputs_schema_usecases: 'FEATURE_STORE',
    extra_inputs_fg_demos: false,
    timewindow_demo: false,
    profile_groups_demo: false,
    show_log_links: false,
  } as IConfigFlags,

  NavBottomHeight: 24,
  headerTopHeight: 24,
  navTopHeight: 0,
  navTopHeightOptions: 0,
  headerHeight: () => /*Constants.flags.show_search_top ? (60-14) : */ 60,
  navWidth: 248,
  navWidthCollapsed: 60,
  navWidthExtended: 320,
  backColor: () => (Utils.isDark() ? '#1D1E1F' : '#e6e6e6'),
  navBackColor: () => (Utils.isDark() ? '#19232f' : '#4D5250'),
  navBackDarkColor: () => (Utils.isDark() ? '#131b26' : '#ffffff'),
  navHeaderColor: () => (Utils.isDark() ? '#0c121b' : '#d3d3d3'),

  lineColor: () => (Utils.isDark() ? '#111111' : '#f0f0f0'),
  backBlueDark: () => (Utils.isDark() ? '#131b26' : '#ffffff'),

  navBackLightColor: () => (Utils.isDark() ? '#484b4f' : '#989898'),
  navBackSelectedColor: () => (Utils.isDark() ? '#6698c8' : '#6698c8'),
  headerTopBackColor: () => (Utils.isDark() ? '#171718' : '#d9d9d9'),
  headerBottomBackColor: () => (Utils.isDark() ? '#070f1b' : '#d9d9d9'),
  repoVersionLast: 'Last',
  searchHeight: 30,
  blue: '#4990E2',

  updateFrom: function (values) {
    if (!values || !_.isObject(values)) {
      return;
    }

    let kk = Object.keys(values);
    kk.some((k1) => {
      Constants.flags[k1] = values[k1];
    });

    Constants.disableAiFunctionalities = Constants.flags.onprem;
  },
};

export default Constants;
