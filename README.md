# react-widget-boilerplate [![build status](https://travis-ci.org/cncjs/react-widget-boilerplate.svg?branch=master)](https://travis-ci.org/cncjs/react-widget-boilerplate) [![Coverage Status](https://coveralls.io/repos/github/cncjs/react-widget-boilerplate/badge.svg?branch=master)](https://coveralls.io/github/cncjs/react-widget-boilerplate?branch=master)

React Widget Boilerplate

## Under Construction

This repository is still under construction and content may change. Do not rely on the information on this page. The custom widget support will soon be available. Stay tuned for further updates.

## Installation

```
npm i -g npm
npm install
```

## Development

Run `npm run dev` to start a local development server for development and testing. After that, connect to http://localhost:8000 and wait until bundle finished.

## Production

Run `npm run prepublish` to build production code. It will output index.html, fonts, images, and JavaScript files to the dist folder. 

To load a custom widget on CNCjs, you need to copy all dist files to a directory (e.g. /home/widget), and specify a mount path for the static directory, as shown below:

```
mkdir -p /home/widget
cp -af /path/to/react-widget-boilerplate/dist/* /home/widget
cnc -vv --mount /widget:/home/widget
```

## License

MIT
