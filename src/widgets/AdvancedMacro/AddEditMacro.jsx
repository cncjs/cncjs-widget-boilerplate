/* eslint-disable no-unused-vars */
import chainedFunction from 'chained-function';
import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';
import Prism from 'prismjs';
import * as ejs from 'ejs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-ejs';
import 'prismjs/components/prism-gcode';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/themes/prism-coy.css';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import portal from '../../lib/portal';
import { Button } from '../../components/Buttons';
import CodeEditor from '../../components/CodeEditor';
import Dropdown, { MenuItem } from '../../components/Dropdown';
import Modal from '../../components/Modal';
import Space from '../../components/Space';
import { Form, Input } from '../../components/Validation';
import i18n from '../../lib/i18n';
import * as validations from '../../lib/validations';
import styles from './index.styl';
import insertAtCaret from './insertAtCaret';
import TemplateVariable from './TemplateVariable';
import variables from './variables';


const Container = styled.div`
    padding: 10px;
`;

const Panel = styled.div`
    background-color: #fff;
    border: 1px solid #ccc;
    box-shadow: 0 1px 1px rgba(0, 0, 0, .05);
`;

const PanelHeader = styled.div`
    color: #333;
    font-weight: bold;
    background-color: #fafafa;
    padding: 5px 10px;
    border-bottom: 1px solid #ccc;
`;


class AddEditMacro extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    static ModeEnum = {
        MODE_UNSET: 'MODE_UNSET',
        MODE_ADD: 'MODE_ADD',
        MODE_EDIT: 'MODE_EDIT'
    };

    state = {
        addEditMode: AddEditMacro.ModeEnum.MODE_UNSET,
        template_variables: [],
        template_input: '',
        template_output: ''
    }

    fields = {
        name: null,
        template: null
    };

    get value() {
        const {
            name
        } = this.form.getValues();

        let content = {
            template_variables: this.state.template_variables,
            template_input: this.state.template_input
        };
        return {
            name: name,
            content: JSON.stringify(content)
        };
    }

    componentDidMount() {
        const { content } = { ...this.props.state.modal.params };
        if (!content) {
            this.addEditMode = AddEditMacro.ModeEnum.MODE_ADD;
            return;
        }

        this.addEditMode = AddEditMacro.ModeEnum.MODE_EDIT;
        let parsedContent = JSON.parse(content);

        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({
            template_variables: parsedContent.template_variables,
            template_input: parsedContent.template_input
        });
    }

    handleAddTemplateVariable = () => {
        this.setState((prevState) => {
            let temp = [...prevState.template_variables];
            temp.push({ name: undefined, value: undefined });
            return { template_variables: temp };
        });
    }

    handleDeleteTemplateVariable = (key) => {
        this.setState((prevState) => {
            let temp = [...prevState.template_variables];
            temp.splice(key, 1);
            return { template_variables: temp };
        });
    }

    handleChangeTemplateVariable = (id, evt) => {
        this.setState((prevState) => {
            const value = evt.target.value;
            let temp = [...prevState.template_variables];
            temp[id][evt.target.name] = value;
            return { template_variables: temp };
        });
    };

    modalFooter() {
        const { state, actions } = this.props;
        const { id } = { ...state.modal.params };

        return (
            <Modal.Footer>
                {this.addEditMode === AddEditMacro.ModeEnum.MODE_EDIT &&
                    (
                        <Button
                            btnStyle="danger"
                            className="pull-left"
                            onClick={() => {
                                const name = get(this.fields.name, 'value');

                                portal(({ onClose }) => (
                                    <Modal disableOverlay={false} size="xs" onClose={onClose}>
                                        <Modal.Header>
                                            <Modal.Title>
                                                {i18n._('Delete Template')}
                                            </Modal.Title>
                                        </Modal.Header>
                                        <Modal.Body>
                                            {i18n._('Are you sure you want to delete this template?')}
                                            <p><strong>{name}</strong></p>
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button onClick={onClose}>
                                                {i18n._('No')}
                                            </Button>
                                            <Button
                                                btnStyle="danger"
                                                onClick={chainedFunction(
                                                    () => {
                                                        actions.deleteMacro(id);
                                                        actions.closeModal();
                                                    },
                                                    onClose
                                                )}
                                            >
                                                {i18n._('Yes')}
                                            </Button>
                                        </Modal.Footer>
                                    </Modal>
                                ));
                            }}
                        >
                            {i18n._('Delete')}
                        </Button>
                    )
                }
                <Button
                    onClick={() => {
                        actions.closeModal();
                    }}
                >
                    {i18n._('Cancel')}
                </Button>
                <Button
                    btnStyle="primary"
                    onClick={() => {
                        this.form.validate(err => {
                            if (err) {
                                return;
                            }

                            const { name, content } = this.value;
                            switch (this.addEditMode) {
                            case AddEditMacro.ModeEnum.MODE_ADD:
                                actions.addMacro({ name, content });
                                break;
                            case AddEditMacro.ModeEnum.MODE_EDIT:
                                actions.updateMacro(id, { name, content });
                                break;
                            default:
                                throw new Error('Unknown state for addEditMode');
                            }
                            actions.closeModal();
                        });
                    }}
                >
                    {(this.addEditMode === AddEditMacro.ModeEnum.MODE_EDIT ? i18n._('Save Changes') : i18n._('OK'))}
                </Button>
            </Modal.Footer>
        );
    }

    generateTemplate(callOnCompletion) {
        //Convert list of key-val pairs to single dictionary
        let temp = this.state.template_variables.reduce((a, x) => ({ ...a, [x.name]: x.value }), {});

        try {
            this.setState((prevState) => {
                const output = ejs.render(prevState.template_input, temp);
                return { template_output: output };
            }, callOnCompletion);
        } catch (err) {
            this.setState({
                template_output: err.message
            });
        }
    }

    render() {
        const { state, actions } = this.props;
        const { id, name } = { ...state.modal.params };
        return (
            <Container>
                <PanelHeader>
                    {(this.state.addEditMode === AddEditMacro.ModeEnum.MODE_EDIT ? i18n._('Edit Template') : i18n._('Add Template'))}
                </PanelHeader>
                <Form
                    ref={c => {
                        this.form = c;
                    }}
                    onSubmit={(event) => {
                        event.preventDefault();
                    }}
                >
                    <div className="form-group">
                        <label>{i18n._('Macro Name')}</label>
                        <Input
                            ref={c => {
                                this.fields.name = c;
                            }}
                            type="text"
                            className="form-control"
                            name="name"
                            value={name}
                            validations={[validations.required]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{i18n._('Template Variables')}</label>
                        <button
                            type="button"
                            className="btn btn-default pull-right"
                            onClick={this.handleAddTemplateVariable}
                            style={{ verticalAlign: 'baseline', display: 'inline-block', textAlign: 'center' }}
                        >
                            <i
                                className="fa fa-plus"
                                style={{ verticalAlign: 'baseline', display: 'inline-block', textAlign: 'center' }}
                            />
                        </button>
                        <Space height="32" />
                        {Object.keys(this.state.template_variables).map((item, idx) => {
                            return (
                                <TemplateVariable
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={idx}
                                    templateId={idx}
                                    name={this.state.template_variables[item].name}
                                    value={this.state.template_variables[item].value}
                                    onDeleteClick={this.handleDeleteTemplateVariable}
                                    onChange={this.handleChangeTemplateVariable}
                                />
                            );
                        })}
                    </div>

                    <div className="form-group" style={{ display: 'inline-block', width: '100%', marginBottom: '4px' }}>
                        <label>{i18n._('Template')}</label>
                        <Dropdown
                            id="edit-macro-dropdown"
                            className="pull-right"
                            onSelect={(eventKey) => {
                                const textarea = ReactDOM.findDOMNode(this.fields.template).querySelector('#template_textarea');
                                if (textarea) {
                                    this.setState({
                                        template_input: insertAtCaret(textarea, eventKey)
                                    });
                                }
                            }}
                        >
                            <Dropdown.Toggle
                                className={styles.btnLink}
                                style={{ boxShadow: 'none' }}
                                useAnchor
                                noCaret
                            >
                                <i className="fa fa-plus" />
                                <Space width="8" />
                                {i18n._('Macro Variables')}
                                <Space width="4" />
                                <i className="fa fa-caret-down" />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className={styles.macroVariablesDropdown}>
                                {variables.map(v => {
                                    if (typeof v === 'object') {
                                        return (
                                            <MenuItem
                                                header={v.type === 'header'}
                                                key={uniqueId()}
                                            >
                                                {v.text}
                                            </MenuItem>
                                        );
                                    }

                                    return (
                                        <MenuItem
                                            eventKey={v}
                                            key={uniqueId()}
                                        >
                                            {v}
                                        </MenuItem>
                                    );
                                })}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                    <CodeEditor
                        ref={c => {
                            this.fields.template = c;
                        }}
                        textareaClassName="form-control"
                        textareaId="template_textarea"
                        value={this.state.template_input}
                        onValueChange={code => this.setState({ template_input: code })}
                        highlight={code => Prism.highlight(code, Prism.languages.js, 'js')}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                            height: '15vh'
                        }}
                    />
                    <Space height="4px" />
                    <Button
                        onClick={() => {
                            this.generateTemplate(() => {
                                const { actions } = this.props;
                                actions.loadMacro(this.state.template_output, { name: name, size: this.state.template_output.length });
                            });
                        }}
                    >
                        {i18n._('Generate & Load')}
                    </Button>
                    <div className="form-group">
                        <div>
                            <label>{i18n._('Output')}</label>
                        </div>
                        <CodeEditor
                            rows={10}
                            disabled={true}
                            className="form-control"
                            value={this.state.template_output}
                            //onValueChange={code => this.setState({ template_output: code })}
                            highlight={code => Prism.highlight(code, Prism.languages.gcode, 'gcode')}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 12,
                                border: '1px solid #ccc',
                                height: 'calc(15vh)'
                            }}
                        />

                    </div>
                </Form>
                { this.modalFooter()}
            </Container>
        );
    }
}

export default AddEditMacro;
