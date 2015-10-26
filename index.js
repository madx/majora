#!/usr/bin/env node

// -----------------------------------------------------------------------------
// File processing
import path from "path"
import fs from "fs"
import fmt from "chalk"
import gaze from "gaze"
import mkdirp from "mkdirp"

// -----------------------------------------------------------------------------
// Config
const defaultConfig = {
  content: "content",
  build: "build",
  templates: "templates",
  markdown: {},
}
const pkg = path.resolve("./package")
const config = Object.assign({}, defaultConfig, require(pkg).majora || {})

for (const flag of ["-w", "--watch"]) {
  config.watch = (process.argv.indexOf(flag) !== -1)
}

// -----------------------------------------------------------------------------
// Rendering
import matter from "gray-matter"
import MarkdownIt from "markdown-it"
import {renderString, deku} from "deku"
import element from "virtual-element"

const templates = {}
templates.Default = {
  render({props}) {
    return <html>{props.formattedContent}</html>
  },
}

const md = new MarkdownIt(config.markdown || {})

// -----------------------------------------------------------------------------
// Logging
const log = (msg) => console.log(fmt.green(msg))
const error = (msg) => console.error(fmt.red(msg))
const warn = (msg) => console.warn(fmt.yellow(msg))

// -----------------------------------------------------------------------------
// File processing
const context = []

function convertFileName(fileName) {
  const contentRelativeFileName = path.relative(config.content, fileName)

  return path.resolve(config.build, contentRelativeFileName)
    .replace(/\.md$/, ".html")
    .replace(/\.from\.js$/, "")
}

function processFile(fileName) {
  const outputFileName = convertFileName(fileName)
  const outputDirName = path.dirname(outputFileName)

  mkdirp(outputDirName)

  if (isMd(fileName)) {
    log(`> Converting ${path.relative(config.content, fileName)}`)
    fs.writeFileSync(outputFileName, renderPage(fileName))
  } else if (isFromJs(fileName)) {
    log(`> Executing ${path.relative(config.content, fileName)}`)
    const scriptOutput = renderScript(fileName)

    if (scriptOutput) {
      fs.writeFileSync(outputFileName, scriptOutput)
    }
  } else {
    log(`> Copying ${path.relative(config.content, fileName)}`)
    fs.writeFileSync(outputFileName, fs.readFileSync(fileName))
  }
}

function removeFile(fileName) {
  const outputFileName = convertFileName(fileName)
  warn(`> Unlinking ${outputFileName}`)
  if (fs.existsSync(outputFileName)) {
    fs.unlink(outputFileName)
  }
}

function renderPage(fileName) {
  const props = context[fileName]

  props.data.template = props.data.template || "Default"

  if (!templates[props.data.template]) {
    const templatePath = path.resolve(config.templates, props.data.template)
    try {
      const template = require(templatePath)
      templates[props.data.template] = template
    } catch (e) {
      throw new Error(`Missing template ${props.data.template}`)
    }
  }

  return renderString(deku({
    type: templates[props.data.template],
    attributes: props,
  }))
}

function renderScript(fileName) {
  const script = require(fileName)

  return script.render(context, config)
}

function parsePage(fileName) {
  const page = matter.read(fileName)

  page.formattedContent = md.render(page.content)
  page.context = Object.keys(context).map(k => context[k])

  return page
}

function isMd(fileName) {
  return /.md$/.test(fileName)
}

function isFromJs(fileName) {
  return /.from.js$/.test(fileName)
}

// -----------------------------------------------------------------------------
// Main code

// Start watcher
const watcher = new gaze.Gaze(`${config.content}/**/*`)

watcher.on("changed", processFile)

watcher.on("added", (fileName) => {
  if (isMd(fileName)) {
    context[fileName] = parsePage(fileName)
  }
  processFile(fileName)
})

watcher.on("deleted", (fileName) => {
  delete context[fileName]
  removeFile(fileName)
})

watcher.on("error", error)

watcher.once("ready", () => {
  const watchedDirs = watcher.watched()
  const watchedFiles = Object.keys(watchedDirs)
      .reduce((a, dir) => a.concat(watchedDirs[dir]), [])

  watchedFiles
    .filter(isMd)
    .forEach(fn => context[fn] = parsePage(fn))
  watchedFiles.forEach(processFile)

  if (!config.watch) {
    watcher.close()
  }
})
