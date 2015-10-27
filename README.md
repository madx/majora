![Majora](logo.png)

![NPM Version](https://img.shields.io/npm/v/majora.svg)
![NPM License](https://img.shields.io/npm/l/majora.svg)

## Setup

``` console
$ mkdir path/to/website; cd path/to/website
$ npm install majora virtual-element # or magic-virtual-element if you like
```

If you wish to use ES6 in your templates, just add `babel` to the `npm install`
line.

## Usage

Create a `content/` folder with your Markdown files (extension has to be
`.md`). Run `majora` to build the corresponding HTML files in the `build/`
folder.

Any other files are copied as-is.

Files ending in `.from.js` will be run as JavaScript files. They are expected
to export a `render` method.

If `render` returns something, the result will be put in an output file with
the same name as the input file, without the `.from.js` part.

This can be useful to create generated pages for example.

## Templates

Put your Deku templates in the `templates/` folder and use them by specifying
the name of the file in your Markdown file's front matter.

``` md
---
template: Post
---
# This is a post!
```

The `props` argument to you Deku components will receive the following fields:

- `formattedContent`: The converted Markdown
- `context`: The list of Markdown files processed by Majora
