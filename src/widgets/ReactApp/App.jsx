import get from 'lodash.get';
import mapValues from 'lodash.mapvalues';
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import controller from '../../lib/controller';
import {
    in2mm,
    toFixedUnits
} from '../../lib/units';
import {
    // Units
    IMPERIAL_UNITS,
    METRIC_UNITS,
    // Controllers
    GRBL,
    SMOOTHIE,
    TINYG
} from '../../constants';

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

const PanelBody = styled.div`
    padding: 10px;
`;

const TextField = styled.div`
    &:before,
    &:after {
        display: table;
        content: " ";
    }
    &:after {
        clear: both;
    }

    margin-bottom: 5px;
    &:last-child {
        margin-bottom: 0;
    }
`;

const TextFieldLabel = styled.div`
    float: left;
    width: 33.33333333%
`;

const TextFieldContent = styled.div`
    float: left;
    width: 66.66666667%;
    min-height: 22px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    background-color: #f5f5f5;
    border: 1px solid #e3e3e3;
    border-radius: 3px;
    box-shadow: inset 0 1px 1px rgba(0,0,0,0.05);
    margin-bottom: 0;
    padding: 0 5px;
`;

class App extends PureComponent {
    static propTypes = {
    };

    state = this.getInitialState();
    controllerEvent = {
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'workflow:state': (state, context) => {
            this.setState({
                workflow: {
                    state: state,
                    context: context
                }
            });
        },
        'controller:state': (controllerType, controllerState) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: controllerType,
                    state: controllerState
                }
            }));

            if (controllerType === GRBL) {
                const {
                    status: { mpos, wpos },
                    parserstate: { modal = {} }
                } = controllerState;

                // Units
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;

                this.setState(state => ({
                    units: units,
                    machinePosition: { // Reported in mm ($13=0) or inches ($13=1)
                        ...state.machinePosition,
                        ...mpos
                    },
                    workPosition: { // Reported in mm ($13=0) or inches ($13=1)
                        ...state.workPosition,
                        ...wpos
                    }
                }));
            }

            if (controllerType === SMOOTHIE) {
                const {
                    status: { mpos, wpos },
                    parserstate: { modal = {} }
                } = controllerState;

                // Units
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;

                this.setState(state => ({
                    units: units,
                    machinePosition: mapValues({ // Reported in current units
                        ...state.machinePosition,
                        ...mpos
                    }, (val) => {
                        return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
                    }),
                    workPosition: mapValues({ // Reported in current units
                        ...state.workPosition,
                        ...wpos
                    }, (val) => {
                        return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
                    })
                }));
            }

            if (controllerType === TINYG) {
                const {
                    sr: { mpos, wpos, modal = {} }
                } = controllerState;

                // Units
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;

                this.setState(state => ({
                    units: units,
                    machinePosition: { // Reported in mm
                        ...state.machinePosition,
                        ...mpos
                    },
                    workPosition: mapValues({ // Reported in current units
                        ...state.workPosition,
                        ...wpos
                    }, (val) => {
                        return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
                    })
                }));
            }
        },
        'controller:settings': (controllerType, controllerSettings) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: controllerType,
                    settings: controllerSettings
                }
            }));
        }
    };

    componentDidMount() {
        this.addControllerEvents();
    }
    componentWillUnmount() {
        this.removeControllerEvents();
    }
    addControllerEvents() {
        Object.keys(this.controllerEvent).forEach(eventName => {
            const callback = this.controllerEvent[eventName];
            controller.addListener(eventName, callback);
        });
    }
    removeControllerEvents() {
        Object.keys(this.controllerEvent).forEach(eventName => {
            const callback = this.controllerEvent[eventName];
            controller.removeListener(eventName, callback);
        });
    }
    getInitialState() {
        return {
            port: controller.port,
            units: METRIC_UNITS,
            controller: {
                type: controller.type,
                state: controller.state
            },
            workflow: {
                state: controller.workflow.state,
                context: controller.workflow.context
            },
            machinePosition: { // Machine position
                x: '0.000',
                y: '0.000',
                z: '0.000',
                a: '0.000'
            },
            workPosition: { // Work position
                x: '0.000',
                y: '0.000',
                z: '0.000',
                a: '0.000'
            }
        };
    }
    render() {
        const {
            port,
            units,
            controller: {
                type: controllerType,
                state: controllerState
            }
        } = this.state;

        if (!port) {
            return (
                <Container style={{ color: '#333', opacity: '.65' }}>
                    No serial connection
                </Container>
            );
        }

        // Map machine position to the display units
        const mpos = mapValues(this.state.machinePosition, (pos, axis) => {
            return String(toFixedUnits(units, pos));
        });

        // Map work position to the display units
        const wpos = mapValues(this.state.workPosition, (pos, axis) => {
            return String(toFixedUnits(units, pos));
        });

        return (
            <Container>
                <div style={{ marginBottom: 5 }}>Port: {port}</div>
                <Panel>
                    <PanelHeader>
                        {controllerType}
                    </PanelHeader>
                    <PanelBody>
                        <TextField>
                            <TextFieldLabel>State</TextFieldLabel>
                            {controllerType === GRBL &&
                            <TextFieldContent>
                                {get(controllerState, 'status.activeState')}
                            </TextFieldContent>
                            }
                            {controllerType === SMOOTHIE &&
                            <TextFieldContent>
                                {get(controllerState, 'status.activeState')}
                            </TextFieldContent>
                            }
                            {controllerType === TINYG &&
                            <TextFieldContent>
                                {get(controllerState, 'sr.machineState')}
                            </TextFieldContent>
                            }
                        </TextField>
                        <TextField>
                            <TextFieldLabel>MPos X</TextFieldLabel>
                            <TextFieldContent>{mpos.x} {units}</TextFieldContent>
                        </TextField>
                        <TextField>
                            <TextFieldLabel>MPos Y</TextFieldLabel>
                            <TextFieldContent>{mpos.y} {units}</TextFieldContent>
                        </TextField>
                        <TextField>
                            <TextFieldLabel>MPos Z</TextFieldLabel>
                            <TextFieldContent>{mpos.z} {units}</TextFieldContent>
                        </TextField>
                        <TextField>
                            <TextFieldLabel>WPos X</TextFieldLabel>
                            <TextFieldContent>{wpos.x} {units}</TextFieldContent>
                        </TextField>
                        <TextField>
                            <TextFieldLabel>WPos Y</TextFieldLabel>
                            <TextFieldContent>{wpos.y} {units}</TextFieldContent>
                        </TextField>
                        <TextField>
                            <TextFieldLabel>WPos Z</TextFieldLabel>
                            <TextFieldContent>{wpos.z} {units}</TextFieldContent>
                        </TextField>
                    </PanelBody>
                </Panel>
            </Container>
        );
    }
}

export default App;
