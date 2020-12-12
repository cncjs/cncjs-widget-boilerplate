/* eslint-disable no-unused-vars */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import includes from 'lodash/includes';
import React, { PureComponent } from 'react';
import 'regenerator-runtime/runtime';
import styled from 'styled-components';
import api from '../../api';
import { Button } from '../../components/Buttons';
import {
    // Grbl
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_RUN,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    SMOOTHIE_ACTIVE_STATE_IDLE,
    SMOOTHIE_ACTIVE_STATE_RUN,
    // TinyG
    TINYG,


    TINYG_MACHINE_STATE_END, TINYG_MACHINE_STATE_READY,


    TINYG_MACHINE_STATE_RUN, TINYG_MACHINE_STATE_STOP,


    // Workflow
    WORKFLOW_STATE_RUNNING
} from '../../constants';
// import Space from 'components/Space';
// import Widget from 'components/Widget';
import controller from '../../lib/controller';
import i18n from '../../lib/i18n';
//import WidgetConfig from '../WidgetConfig';
import log from '../../lib/log';
import AddEditMacro from './AddEditMacro';
import AdvancedMacro from './AdvancedMacro';
import RunMacro from './RunMacro';

import {
    MODAL_ADDEDIT_ADVANCEDMACRO,
    MODAL_ADVANCEDNONE,
    // MODAL_ADD_ADVANCEDMACRO,
    // MODAL_EDIT_ADVANCEDMACRO,
    MODAL_RUN_ADVANCEDMACRO
} from './constants';
import styles from './index.styl';
import Space from '../../components/Space';

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

// const PanelBody = styled.div`
//     padding: 10px;
// `;

class AdvancedMacroWidget extends PureComponent {
    static propTypes = {
        myfn: PropTypes.func
    };

    // Public methods
    // collapse = () => {
    //     this.setState({ minimized: true });
    // };

    // expand = () => {
    //     this.setState({ minimized: false });
    // };

    // //config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = this.state;
            this.setState({
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            });
        },
        //     toggleMinimized: () => {
        //         const { minimized } = this.state;
        //         this.setState({ minimized: !minimized });
        //     },
        openModal: (name = MODAL_ADVANCEDNONE, params = {}) => {
            this.setState({
                modal: {
                    name: name,
                    params: params
                }
            });
        },
        closeModal: () => {
            this.setState({
                modal: {
                    name: MODAL_ADVANCEDNONE,
                    params: {}
                }
            });
        },
        updateModalParams: (params = {}) => {
            this.setState((prevState) => {
                return {
                    modal: {
                        ...prevState.modal,
                        params: {
                            ...prevState.modal.params,
                            ...params
                        }
                    }
                };
            });
        },
        addMacro: async ({ name, content }) => {
            try {
                let res;
                res = await api.macros.create({ name, content });
                res = await api.macros.fetch();
                const { records: macros } = res.body;
                this.setState({ macros: macros });
            } catch (err) {
                // Ignore error
            }
        },
        deleteMacro: async (id) => {
            try {
                let res;
                res = await api.macros.delete(id);
                res = await api.macros.fetch();
                const { records: macros } = res.body;
                this.setState({ macros: macros });
            } catch (err) {
                // Ignore error
            }
        },
        updateMacro: async (id, { name, content }) => {
            try {
                let res;
                res = await api.macros.update(id, { name, content });
                res = await api.macros.fetch();
                const { records: macros } = res.body;
                this.setState({ macros: macros });
            } catch (err) {
                // Ignore error
            }
        },
        runMacro: (id, { name }) => {
            controller.command('macro:run', id, controller.context, (err, data) => {
                if (err) {
                    log.error(`Failed to run the macro: id=${id}, name="${name}"`);
                    return;
                }
            });
        },
        //meta = {name, size}
        loadMacro: (gcode, meta) => {
            const { name } = { ...meta };
            const context = {};

            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: true,
                    rendering: false,
                    ready: false
                }
            }));
            controller.command('gcode:load', name, gcode, context, (err, data) => {
                if (err) {
                    this.setState((state) => ({
                        gcode: {
                            ...state.gcode,
                            loading: false,
                            rendering: false,
                            ready: false
                        }
                    }));
                    console.error('gcode:load', err);
                    log.error(err);
                    return;
                }
                log.debug(data); // TODO
            });
        },

        openAddMacroModal: () => {
            this.actions.openModal(MODAL_ADDEDIT_ADVANCEDMACRO);
        },
        openRunMacroModal: (id) => {
            api.macros.read(id)
                .then((res) => {
                    const { id, name, content } = res.body;
                    this.actions.openModal(MODAL_RUN_ADVANCEDMACRO, { id, name, content });
                });
        },
        openEditMacroModal: (id) => {
            api.macros.read(id)
                .then((res) => {
                    const { id, name, content } = res.body;
                    this.actions.openModal(MODAL_ADDEDIT_ADVANCEDMACRO, { id, name, content });
                });
        },
        cloneMacro: (id) => {
            api.macros.read(id)
                .then((res) => {
                    const { name, content } = res.body;
                    this.actions.addMacro({ name: name + ' (copy)', content });
                });
        }
    };

    controllerEvents = {
        'config:change': () => {
            this.fetchMacros();
        },
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState(state => ({
                ...initialState,
                macros: [...state.macros]
            }));
        },
        'controller:state': (type, controllerState) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    state: controllerState
                }
            }));
        },
        'workflow:state': (workflowState) => {
            this.setState(state => ({
                workflow: {
                    state: workflowState
                }
            }));
        }
    };

    fetchMacros = async () => {
        try {
            let res;
            res = await api.macros.fetch();
            const { records: macros } = res.body;
            this.setState({ macros: macros });
        } catch (err) {
            // Ignore error
        }
    };

    componentDidMount() {
        this.fetchMacros();
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    getInitialState() {
        return {
            //minimized: this.config.get('minimized', false),
            minimized: false,
            isFullscreen: true,
            port: controller.port,
            controller: {
                type: controller.type,
                state: controller.state
            },
            workflow: {
                state: controller.workflow.state
            },
            modal: {
                name: MODAL_ADVANCEDNONE,
                params: {}
            },
            macros: []
        };
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    canClick() {
        const { port, workflow } = this.state;
        const controllerType = this.state.controller.type;
        const controllerState = this.state.controller.state;

        if (!port) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], controllerType)) {
            return false;
        }
        if (controllerType === GRBL) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                GRBL_ACTIVE_STATE_IDLE,
                GRBL_ACTIVE_STATE_RUN
            ];
            if (!includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === MARLIN) {
            // Marlin does not have machine state
        }
        if (controllerType === SMOOTHIE) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                SMOOTHIE_ACTIVE_STATE_IDLE,
                SMOOTHIE_ACTIVE_STATE_RUN
            ];
            if (!includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === TINYG) {
            const machineState = get(controllerState, 'sr.machineState');
            const states = [
                TINYG_MACHINE_STATE_READY,
                TINYG_MACHINE_STATE_STOP,
                TINYG_MACHINE_STATE_END,
                TINYG_MACHINE_STATE_RUN
            ];
            if (!includes(states, machineState)) {
                return false;
            }
        }

        return true;
    }

    render() {
        // //const { widgetId } = this.props;
        const { minimized, isFullscreen } = this.state;
        // const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const state = {
            ...this.state,
            canClick: this.canClick()
        };
        const actions = {
            ...this.actions
        };
        return (
            // <Widget isFullscreen={isFullscreen}>
            <Container>
                <PanelHeader style={{ display: 'inline-block', width: '100%' }}>
                    Templates
                    {/* {state.modal.name === MODAL_ADVANCEDNONE && ( */}
                    <Button
                        compact
                        title={i18n._('New Macro')}
                        onClick={actions.openAddMacroModal}
                        className="pull-right"
                        btnSize="sm"
                    >
                        <i className="fa fa-plus" />
                    </Button>
                    {/* )} */}
                </PanelHeader>
                <Space height="4px" />
                <Panel>
                    {state.modal.name === MODAL_ADVANCEDNONE && (
                        <AdvancedMacro state={state} actions={actions} />
                    )
                    }
                    {state.modal.name === MODAL_RUN_ADVANCEDMACRO &&
                        <RunMacro state={state} actions={actions} />
                    }
                    {state.modal.name === MODAL_ADDEDIT_ADVANCEDMACRO &&
                        <AddEditMacro state={state} actions={actions} />
                    }
                </Panel>
            </Container>
        );
    }
}

export default AdvancedMacroWidget;
