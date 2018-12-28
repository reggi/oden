#!/usr/bin/env node
const { tmpdir } = require('os');
const { promisify } = require('util')
const { spawn, exec } = require('child_process');
const execAsync = promisify(exec);
const path = require("path");
const argv = process.argv;
const [bin, executed, file] = argv;

const TS_NODE = path.join(__dirname, './node_modules/.bin/ts-node');
const WEBPACK = path.join(__dirname, './node_modules/.bin/webpack');
const WEBPACK_CONFIG = path.join(__dirname, './webpack.config.js');

const WEBPACK_COMMAND = (entry, output) => {
    const outputPath = path.relative(__dirname, path.dirname(output));
    const outputFile = path.basename(output);
    console.log({ entry, output, outputFile, outputPath })
    return `${WEBPACK} --config ${WEBPACK_CONFIG} --entry ${entry} --output-path ${outputPath} --output-filename ${outputFile}`
}

if (!file) {
    spawn(TS_NODE, [], { stdio: 'inherit' })
} else {
    const entry = path.join(process.cwd(), file);
    const output = path.join(process.cwd(), './oden_dist', process.cwd(), file);
    console.log({ entry, output })
    execAsync(WEBPACK_COMMAND(entry, output))
        .then((...args) => {
            console.log(args)
            spawn(`${TS_NODE} ${output}`, [], { stdio: 'inherit' })
        })
}
