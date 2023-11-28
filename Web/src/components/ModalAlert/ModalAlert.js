import PropTypes from 'prop-types';
import React from 'react';
import { Button, Modal } from 'react-bootstrap';
var _ = require('lodash');

class ModalAlert extends React.PureComponent {
  constructor(props) {
    super();

    this.state = {
      showModal: false,
    };
  }

  close = () => {
    this.setState({ showModal: false });
    this.props.onHideAlert && this.props.onHideAlert();
  };

  open = (cbFinish) => {
    this.setState({ showModal: true }, cbFinish);
  };

  onClickResp = (value) => {
    if (this.props.onClickResp) {
      this.props.onClickResp(value);
    }
    this.close();
  };

  thisSetState = (name, value) => {
    var obj = {};
    obj[name] = value;
    this.setState(obj);
  };

  thisGetState = (name) => {
    return this.state[name];
  };

  render() {
    return (
      <div>
        <Modal backdrop={this.props.dontHideOnClick ? 'static' : true} show={this.state.showModal} onHide={this.close} style={{ zIndex: 3000 }} dialogClassName={this.props.dialogClass}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.title || ''}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="body2">{this.props.children}</div>
          </Modal.Body>
          <Modal.Footer>
            {this.props.noText && <Button onClick={this.onClickResp.bind(this, false)}>{this.props.noText || 'No'}</Button>}
            <Button type="primary" onClick={this.onClickResp.bind(this, true)}>
              {this.props.yesText || 'Close'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

ModalAlert.propTypes = {
  onHideAlert: PropTypes.func,
  onClickResp: PropTypes.func,
  title: PropTypes.string,
  yesText: PropTypes.string,
  noText: PropTypes.string,
  dialogClass: PropTypes.string,
  dontHideOnClick: PropTypes.bool,
};

export default ModalAlert;
