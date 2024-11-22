# cncjs-widget-boilerplate

**Custom Widget for CNCjs**

## Version Compatibility

Custom Widget Version | CNCjs Version
:-------------------- | :------------
0.x                   | 1.9.10 or 1.9.11
1.x                   | >=1.9.12 or later patch versions
2.x                   | >=2.0.0 or later versions

This branch is for CNCjs 2.0.0 or later versions. If you're looking for the previous version (>= 1.9.10), please visit the master branch.

## Installation

```bash
yarn install
```

## Development Guide

Create a directory under <b>src/widgets</b> and put your code in there.

```
src/
   widgets/
      custom/index.jsx
```

Run `yarn dev` to start a development server.

### Query Parameters

Name | Description
:--- | :----------
token | (Required) An authentication token to enable secure communication. The token will be automatically set by CNCjs.
host | (Optional) Specifies the host to connect to. Defaults to an empty string.

### Examples

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
