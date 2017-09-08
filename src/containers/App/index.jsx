import React, { PureComponent } from 'react';
import controller from '../../lib/controller';
import {
    GRBL,
    SMOOTHIE,
    TINYG
} from '../../constants';
import styles from './index.styl';

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
        'workflow:state': (workflowState) => {
            if (this.state.workflowState !== workflowState) {
                this.setState({ workflowState: workflowState });
            }
        },
        'Grbl:state': (state) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: GRBL,
                    state: state
                }
            });
        },
        'Grbl:settings': (settings) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: GRBL,
                    settings: settings
                }
            });
        },
        'Smoothie:state': (state) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: SMOOTHIE,
                    state: state
                }
            });
        },
        'Smoothie:settings': (settings) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: SMOOTHIE,
                    settings: settings
                }
            });
        },
        'TinyG:state': (state) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: TINYG,
                    state: state
                }
            });
        },
        'TinyG:settings': (settings) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: TINYG,
                    settings: settings
                }
            });
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
            controller.on(eventName, callback);
        });
    }
    removeControllerEvents() {
        Object.keys(this.controllerEvent).forEach(eventName => {
            const callback = this.controllerEvent[eventName];
            controller.off(eventName, callback);
        });
    }
    getInitialState() {
        return {
            port: controller.port,
            controller: {
                type: controller.type,
                state: controller.state
            },
            workflowState: controller.workflowState
        };
    }
    render() {
        const { port, controller, workflowState } = this.state;

        return (
            <div className={styles.container}>
                <div>Port: {port}</div>
                <div>Controller type: {controller.type}</div>
                <div>Workflow state: {workflowState}</div>
            </div>
        );
    }
}

export default App;
