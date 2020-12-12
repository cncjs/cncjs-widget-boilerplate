import React from 'react';
import ReactDOM from 'react-dom';
import AdvancedMacroWidget from './App';

export default (resizeOb) => {
    ReactDOM.render(
        <AdvancedMacroWidget />,
        document.getElementById('viewport')
    );
};
