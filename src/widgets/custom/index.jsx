import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

export const render = () => {
  let rootElement = document.getElementById('root');

  // If the element doesn't exist, create and append it
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'root');
    document.body.appendChild(rootElement);
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};
