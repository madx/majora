![Majora](logo.png)

## Setup

``` console
$ mkdir path/to/website; cd path/to/website
$ npm install majora
```

## Usage

Create a `content/` folder with your Markdown files. Run `majora` to build the
corresponding HTML files in the `build/` folder.

## Templates

Put your Deku templates in the `templates/` folder and use them by specifying
the name of the file in your Markdown file's front matter.

``` md
---
template: Post
---
# This is a post!
```
