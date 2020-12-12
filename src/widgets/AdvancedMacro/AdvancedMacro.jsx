import ensureArray from 'ensure-array';
import includes from 'lodash/includes';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from '../../components/Buttons';
import Space from '../../components/Space';
import {
    // Workflow
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED
} from '../../constants';
import i18n from '../../lib/i18n';
import styles from './index.styl';

class AdvancedMacro extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    handleRunMacro = (macro) => (event) => {
        const { actions } = this.props;
        actions.openRunMacroModal(macro.id);
    };

    handleEditMacro = (macro) => (event) => {
        const { actions } = this.props;
        actions.openEditMacroModal(macro.id);
    };

    handleCloneMacro = (macro) => (event) => {
        const { actions } = this.props;
        actions.cloneMacro(macro.id);
    };

    render() {
        const { state } = this.props;
        const {
            canClick,
            workflow,
            macros = []
        } = state;
        //For debugging locally, add the || true
        //const canRunMacro = canClick && includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflow.state); //|| true;
        const canRunMacro = canClick && includes([WORKFLOW_STATE_IDLE], workflow.state);

        return (
            <div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <tbody>
                            {macros.length === 0 && (
                                <tr>
                                    <td colSpan="2">
                                        <div className={styles.emptyResult}>
                                            {i18n._('No macros')}
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {ensureArray(macros).map((macro, index) => (
                                <tr key={macro.id}>
                                    <td>
                                        <Button
                                            compact
                                            btnSize="xs"
                                            btnStyle="flat"
                                            disabled={!canRunMacro}
                                            onClick={this.handleRunMacro(macro)}
                                            title={i18n._('Run Macro')}
                                        >
                                            <i className="fa fa-play" />
                                        </Button>
                                        <Space width="8" />
                                        {macro.name}
                                    </td>
                                    <td style={{ width: '1%' }}>
                                        <div className="nowrap">
                                            {/* <Button
                                                compact
                                                btnSize="xs"
                                                btnStyle="flat"
                                                disabled={!canLoadMacro}
                                                onClick={this.handleLoadMacro(macro)}
                                                title={i18n._('Load Macro')}
                                            >
                                                <i className="fa fa-chevron-up" />
                                            </Button> */}
                                            <Button
                                                compact
                                                btnSize="xs"
                                                btnStyle="flat"
                                                onClick={this.handleEditMacro(macro)}
                                                title={i18n._('Edit Macro')}
                                            >
                                                <i className="fa fa-edit" />
                                            </Button>
                                            <Button
                                                compact
                                                btnSize="xs"
                                                btnStyle="flat"
                                                onClick={this.handleCloneMacro(macro)}
                                                title={i18n._('Clone Macro')}
                                            >
                                                <i className="fa fa-clone" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default AdvancedMacro;
