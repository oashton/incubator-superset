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
/* eslint-env browser */
import React from 'react';
import PropTypes from 'prop-types';
import { Button, FormControl, FormGroup } from 'react-bootstrap';
import { CategoricalColorNamespace } from '@superset-ui/color';
import { t } from '@superset-ui/translation';
import { getShortUrlWithBookmark } from '../../utils/common';

import ModalTrigger from '../../components/ModalTrigger';

const propTypes = {
  addSuccessToast: PropTypes.func.isRequired,
  addDangerToast: PropTypes.func.isRequired,
  dashboardId: PropTypes.number.isRequired,
  defaultBookmarName: PropTypes.string.isRequired,
  layout: PropTypes.object.isRequired,
  triggerNode: PropTypes.node.isRequired,
  css: PropTypes.string.isRequired,
  colorNamespace: PropTypes.string,
  colorScheme: PropTypes.string,
  isMenuItem: PropTypes.bool,
  canOverwrite: PropTypes.bool.isRequired,
  refreshFrequency: PropTypes.number.isRequired,
};

const defaultProps = {
  isMenuItem: false,
  colorNamespace: undefined,
  colorScheme: undefined,
};

class SaveModal extends React.PureComponent {
  constructor(props) {
    super(props);
    this.modal = null;
    this.state = {
      bookmarkName: props.defaultBookmarName,
    };
    this.handleNameChange = this.handleNameChange.bind(this);
    this.saveBookmark = this.saveBookmark.bind(this);
    this.setModalRef = this.setModalRef.bind(this);
  }

  setModalRef(ref) {
    this.modal = ref;
  }

  handleNameChange(event) {
    this.setState({
      bookmarkName: event.target.value,
    });
  }

  saveBookmark() {
    const { bookmarkName } = this.state;
    if (!bookmarkName) {
      this.props.addDangerToast(t('You must pick a name for the bookmark'));
    } else {
      getShortUrlWithBookmark(this.props.url, bookmarkName).then(
        this.setState({
          bookmarkName: '',
        }),
      );
      this.modal.close();
    }
  }

  render() {
    return (
      <ModalTrigger
        ref={this.setModalRef}
        isMenuItem={this.props.isMenuItem}
        triggerNode={this.props.triggerNode}
        modalTitle={t('Save Bookmark')}
        modalBody={
          <FormGroup>
            <FormControl
              type="text"
              placeholder={t('[bookmark name]')}
              value={this.state.bookmarkName}
              onFocus={this.handleNameChange}
              onChange={this.handleNameChange}
            />
          </FormGroup>
        }
        modalFooter={
          <div>
            <Button bsStyle="primary" onClick={this.saveBookmark}>
              {t('Save')}
            </Button>
          </div>
        }
      />
    );
  }
}

SaveModal.propTypes = propTypes;
SaveModal.defaultProps = defaultProps;

export default SaveModal;
