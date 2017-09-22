# cncjs-widget-boilerplate [![build status](https://travis-ci.org/cncjs/cncjs-widget-boilerplate.svg?branch=master)](https://travis-ci.org/cncjs/cncjs-widget-boilerplate) [![Coverage Status](https://coveralls.io/repos/github/cncjs/cncjs-widget-boilerplate/badge.svg?branch=master)](https://coveralls.io/github/cncjs/cncjs-widget-boilerplate?branch=master)

**Custom widget support is only available for CNCjs 1.9.10 or later versions**

## Installation

```bash
npm i -g npm # Upgrade NPM to the latest version
npm install
```

## Development Guide

Create a directory under <b>src/widgets</b> and put your code in there.

```
src/
   widgets/
      MyApp/index.js
```

When connecting to a local development server, you can specify the "widget" query parameter within your browser to switch between widgets (e.g. `http://localhost:5000/?widget=MyApp`).

### Query Parameters

Name | Description
:--- | :----------
token | (Required) An authentication token to enable secure communication. The token will be automatically set by CNCjs.
host | (Optional) Specifies the host to connect to. Defaults to an empty string.
widget | (Optional) Specifies a folder name under 'src/widgets'. Defaults to 'ReactApp'.

### Examples

#### React App

There is a widget written with React, you can download it from the releases page: https://github.com/cncjs/cncjs-widget-boilerplate/releases

![image](https://user-images.githubusercontent.com/447801/30728983-b866f4b6-9f8e-11e7-9a90-6b712344d270.png)

## Development

Run `npm run dev` to start a local development server for development, then connect to http://localhost:5000 and wait until bundle finished.

You can specify a mount path to test your widgets with CNCjs:
```bash
cnc -vv --mount /widget:/path/to/cncjs-widget-boilerplate/dist
```

## Production

Run `npm run prepublish` to build production code. It will output index.html, fonts, images, and JavaScript files to the dist folder. 

After that, you can copy all dist files to a directory (e.g. /home/widget), and specify a mount path for the static directory, as shown below:
```bash
mkdir -p /home/widget
cp -af /path/to/cncjs-widget-boilerplate/dist/* /home/widget
cnc --mount /widget:/home/widget
```

### Configure CNCjs

1. Click <b>Manage Widgets</b> to add a custom widget<br>
    ![image](https://user-images.githubusercontent.com/447801/30728946-78e1d860-9f8e-11e7-96c5-e8bbd06b1c0f.png)

2. Click the <img src="https://cdn.rawgit.com/cncjs/cncjs/master/media/font-awesome/black/svg/cog.svg" width="16" title="Edit" /> icon to configure widget settings<br>
    ![image](https://user-images.githubusercontent.com/447801/30729069-593dc4dc-9f8f-11e7-8a63-1e46249bbe34.png)
    
3. If everything goes well, you will see the loaded widget, like so:<br>
    ![image](https://user-images.githubusercontent.com/447801/30728983-b866f4b6-9f8e-11e7-9a90-6b712344d270.png)

## License

MIT
