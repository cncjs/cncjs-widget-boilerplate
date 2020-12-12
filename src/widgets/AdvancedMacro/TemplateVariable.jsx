import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { FormGroup } from 'react-bootstrap';
import { Input } from '../../components/Forms';
import * as validations from '../../lib/validations';
//import styles from './index.styl';

class TemplateVariable extends PureComponent {
    static propTypes = {
        name: PropTypes.string,
        templateId: PropTypes.number,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        onDeleteClick: PropTypes.func,
        onChange: PropTypes.func,
        nameDisabled: PropTypes.bool,
        valueDisabled: PropTypes.bool,
        hideDeleteButton: PropTypes.bool
    };

    deleteButton() {
        return (
            <button
                type="button"
                className="btn btn-default pull-right"
                style={{ display: 'inline-block' }}
                onClick={() => this.props.onDeleteClick(this.props.templateId)}
            //style= {{ width: '20%' }}
            //{{ verticalAlign: 'baseline', display: 'inline-block', textAlign: 'center' }}
            >
                <i
                    className="fa fa-minus-circle"
                // style={{ verticalAlign: 'baseline', display: 'inline-block', textAlign: 'center' }}
                />
            </button>
        );
    }

    render() {
        let btnDelete = null;
        if (!this.props.hideDeleteButton) {
            btnDelete = this.deleteButton();
        }

        return (
            <FormGroup key={this.props.templateId} style={{ marginBottom: '4px' }}>
                <Input
                    // eslint-disable-next-line no-return-assign
                    ref={(c) => this.nameRef = c}
                    style={{ display: 'inline-block', width: '40%', marginRight: '4px' }}
                    className="form-control"
                    type="text"
                    //className={styles.input}
                    name="name"
                    placeholder="Key"
                    value={this.props.name}
                    onChange={(evt) => {
                        evt.persist();
                        this.props.onChange(this.props.templateId, evt);
                    }}
                    disabled={this.props.nameDisabled}
                    validations={[validations.required]}
                />
                <Input
                    style={{ display: 'inline-block', width: '40%', marginRight: '4px' }}
                    // eslint-disable-next-line no-return-assign
                    ref={(c) => this.valueRef = c}
                    //style={{ width: '30%' }}
                    //style={{ display: 'inline-block', width: '30%' }}
                    //className={styles.templateVariable.input}
                    type="text"
                    //className="pull-middle"
                    name="value"
                    placeholder="Value"
                    value={this.props.value}
                    onChange={(evt) => {
                        evt.persist();
                        this.props.onChange(this.props.templateId, evt);
                    }}
                    disabled={this.props.valueDisabled}
                    validations={[validations.required]}
                />
                {btnDelete}
            </FormGroup>
        );
    }
}

export default TemplateVariable;
