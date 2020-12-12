//import chainedFunction from 'chained-function';
import * as ejs from 'ejs';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-ejs';
import 'prismjs/components/prism-gcode';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/themes/prism-coy.css';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/Buttons';
import CodeEditor from '../../components/CodeEditor';
import Modal from '../../components/Modal';
import Space from '../../components/Space';
import { Form } from '../../components/Validation';
import i18n from '../../lib/i18n';
import TemplateVariable from './TemplateVariable';
import * as validations from '../../lib/validations';

const Container = styled.div`
    padding: 10px;
`;


const PanelHeader = styled.div`
    color: #333;
    font-weight: bold;
    background-color: #fafafa;
    padding: 5px 10px;
    border-bottom: 1px solid #ccc;
`;


class RunMacro extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
    };

    state = {
        template_variables: [],
        template_input: '',
        template_output: '',
        generator_error_msg: null
    }

    componentDidMount() {
        const { content } = { ...this.props.state.modal.params };
        let parsedContent = JSON.parse(content);

        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({
            template_variables: parsedContent.template_variables,
            template_input: parsedContent.template_input
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
        const { name } = { ...state.modal.params };

        return (
            <Container>
                <PanelHeader>
                    {i18n._('Run Macro')}
                </PanelHeader>
                <Form>
                    <div style={{ marginBottom: 10 }}>
                        <label><strong>{name}</strong></label>
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
                                    nameDisabled={true}
                                    hideDeleteButton={true}
                                />
                            );
                        })}
                        <Space height="32" />
                        <Button
                            onClick={this.generateTemplate}
                        >
                            {i18n._('Generate')}
                        </Button>
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
                                highlight={code => Prism.highlight(code, Prism.languages.gcode, 'gcode')}
                                padding={10}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 12,
                                    border: '1px solid #ccc',
                                    height: 'calc(15vh)'
                                }}
                                validations={[validations.required]}
                            />
                        </div>

                    </div>
                </Form>
                <Modal.Footer>
                    <Button
                        onClick={actions.closeModal}
                    >
                        {i18n._('Cancel')}
                    </Button>
                    {/* <Button
                        //btnStyle="primary"
                        onClick={
                            () => {
                                const { actions } = this.props;
                                actions.loadMacro(this.state.template_output, { name: name, size: this.state.template_output.length });
                                //actions.closeModal();
                            }
                        }
                    >
                        {i18n._('Load')}
                    </Button> */}
                    <Button
                        btnStyle="primary"
                        onClick={
                            () => {
                                // const { actions } = this.props;
                                // actions.loadMacro(this.state.template_output, { name: name, size: this.state.template_output.length });
                                actions.closeModal();
                            }
                        }
                    >
                        {i18n._('OK')}
                    </Button>
                </Modal.Footer>
            </Container>
        );
    }
}

export default RunMacro;
