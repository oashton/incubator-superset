/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Alert } from 'react-bootstrap';
import { t } from '@superset-ui/translation';
import { isFeatureEnabled, FeatureFlag } from 'src/featureFlags';
import { Logger, LOG_ACTIONS_RENDER_CHART } from '../logger/LogUtils';

import Loading from '../components/Loading';
import RefreshChartOverlay from '../components/RefreshChartOverlay';
import ErrorMessageWithStackTrace from '../components/ErrorMessage/ErrorMessageWithStackTrace';
import ErrorBoundary from '../components/ErrorBoundary';
import ChartRenderer from './ChartRenderer';
import './chart.less';
import { getChartDataRequest } from "./chartAction";

const propTypes = {
  annotationData: PropTypes.object,
  actions: PropTypes.object,
  chartId: PropTypes.number.isRequired,
  datasource: PropTypes.object.isRequired,
  // current chart is included by dashboard
  dashboardId: PropTypes.number,
  // original selected values for FilterBox viz
  // so that FilterBox can pre-populate selected values
  // only affect UI control
  initialValues: PropTypes.object,
  // formData contains chart's own filter parameter
  // and merged with extra filter that current dashboard applying
  formData: PropTypes.object.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  setControlValue: PropTypes.func,
  timeout: PropTypes.number,
  vizType: PropTypes.string.isRequired,
  triggerRender: PropTypes.bool,
  // state
  chartAlert: PropTypes.string,
  chartStatus: PropTypes.string,
  chartStackTrace: PropTypes.string,
  queryResponse: PropTypes.object,
  triggerQuery: PropTypes.bool,
  refreshOverlayVisible: PropTypes.bool,
  errorMessage: PropTypes.node,
  // dashboard callbacks
  addFilter: PropTypes.func,
  onQuery: PropTypes.func,
  onFilterMenuOpen: PropTypes.func,
  onFilterMenuClose: PropTypes.func,
};

const BLANK = {};
const BIG_NUMBER_TYPE = 'big_number';
const COLOR_COLUMN = 'color';

const defaultProps = {
  addFilter: () => BLANK,
  onFilterMenuOpen: () => BLANK,
  onFilterMenuClose: () => BLANK,
  initialValues: BLANK,
  setControlValue() {},
  triggerRender: false,
  dashboardId: null,
  chartStackTrace: null,
};

class Chart extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      textColor: 'black'
    }

    this.handleRenderContainerFailure = this.handleRenderContainerFailure.bind(
      this,
    );
    this.getExtraData = this.getExtraData.bind(this);
  }

  componentDidMount() {
    if (this.props.triggerQuery) {
      this.runQuery();
    }
    this.getExtraData();
  }

  componentDidUpdate() {
    if (this.props.triggerQuery) {
      this.runQuery();
    }
    this.getExtraData();
  }
  
  getExtraData() {
    const {
      dashboardId,
      vizType,
      formData,
      chartStatus,
      datasource,
    } = this.props;

    const isColored = (column) => column['column_name'] === COLOR_COLUMN;
    const datasourceReady = 'columns' in datasource
    //const getColorData = datasource.columns.some(isColored) ? datasourceReady : false;
    console.log('Getting extra data...');
    console.log(datasource);
    if (vizType === BIG_NUMBER_TYPE && chartStatus !== 'loading'){
      let queryObj = formData;
      queryObj['columns'] = [COLOR_COLUMN];

      const controller = new AbortController();
      const requestParams = {
        signal: controller.signal,
        timeout: 120 * 1000,
      };
      if (dashboardId) requestParams.dashboard_id = dashboardId;

      const chartDataRequest = getChartDataRequest({
        formData,
        resultformDataFormat: 'json',
        resultType: 'full',
        force: false,
        method: 'POST',
        requestParams,
      });

      const query = chartDataRequest
        .then(json => {
          console.log(json.result);
          const data = json.result[0].data;
          if(data.length > 0) {
            const last_val = data[data.length - 1]
            this.setState({
              textColor: last_val['color'] ? 'color' in last_val : 'black'
            })
          }
        })
    }
  }

  runQuery() {
    if (this.props.chartId > 0 && isFeatureEnabled(FeatureFlag.CLIENT_CACHE)) {
      // Load saved chart with a GET request
      this.props.actions.getSavedChart(
        this.props.formData,
        false,
        this.props.timeout,
        this.props.chartId,
        this.props.dashboardId,
      );
    } else {
      // Create chart with POST request
      this.props.actions.postChartFormData(
        this.props.formData,
        false,
        this.props.timeout,
        this.props.chartId,
        this.props.dashboardId,
      );
    }
  }

  handleRenderContainerFailure(error, info) {
    const { actions, chartId } = this.props;
    console.warn(error); // eslint-disable-line
    actions.chartRenderingFailed(
      error.toString(),
      chartId,
      info ? info.componentStack : null,
    );

    actions.logEvent(LOG_ACTIONS_RENDER_CHART, {
      slice_id: chartId,
      has_err: true,
      error_details: error.toString(),
      start_offset: this.renderStartTime,
      ts: new Date().getTime(),
      duration: Logger.getTimestamp() - this.renderStartTime,
    });
  }

  validateFilterRequiredRestriction() {
    if (
      this.props.formData.all_columns_filter_required &&
      this.props.formData.all_columns_filter_required.length > 0
    ) {
      if (this.props.formData.extra_filters) {
        for (const entry of this.props.formData.extra_filters) {
          for (const filterColumn of this.props.formData
            .all_columns_filter_required) {
            if (filterColumn === entry.col && entry.val !== null) {
              return true;
            }
          }
        }
      }
    } else {
      return true;
    }
    return false;
  }

  renderErrorMessage() {
    const { chartAlert, chartStackTrace, queryResponse } = this.props;
    return (
      <ErrorMessageWithStackTrace
        error={queryResponse?.errors?.[0]}
        message={chartAlert || queryResponse?.message}
        link={queryResponse ? queryResponse.link : null}
        stackTrace={chartStackTrace}
      />
    );
  }

  render() {
    const {
      width,
      height,
      chartAlert,
      chartStatus,
      errorMessage,
      onQuery,
      refreshOverlayVisible,
    } = this.props;

    const isLoading = chartStatus === 'loading';

    // this allows <Loading /> to be positioned in the middle of the chart
    const containerStyles = isLoading ? { height, width } : null;
    const isFaded = refreshOverlayVisible && !errorMessage;
    this.renderContainerStartTime = Logger.getTimestamp();
    const filterValidation = this.validateFilterRequiredRestriction();
    if (chartStatus === 'failed') {
      return this.renderErrorMessage();
    }
    if (errorMessage) {
      return <Alert bsStyle="warning">{errorMessage}</Alert>;
    }
    return (
      <ErrorBoundary
        onError={this.handleRenderContainerFailure}
        showMessage={false}
      >
        <div
          className={`chart-container ${isLoading ? 'is-loading' : ''}`}
          style={containerStyles}
        >
          {!isLoading && !chartAlert && isFaded && (
            <RefreshChartOverlay
              width={width}
              height={height}
              onQuery={onQuery}
            />
          )}
          {filterValidation && (
            <div className={`slice_container ${isFaded ? ' faded' : ''}`}>
              <ChartRenderer textColor={this.state.textColor} {...this.props} />
            </div>
          )}
          {!filterValidation && (
            <h2>
              {t(
                'Please select a value from the filter %s',
                this.props.formData.all_columns_filter_required,
              )}
            </h2>
          )}

          {isLoading && <Loading />}
        </div>
      </ErrorBoundary>
    );
  }
}

Chart.propTypes = propTypes;
Chart.defaultProps = defaultProps;

export default Chart;
