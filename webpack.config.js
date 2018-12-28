const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

function sanitize(input, replacement = '') {
  var illegalRe = /[\/\?<>\\:\*\|":]/g;
  var controlRe = /[\x00-\x1f\x80-\x9f]/g;
  var reservedRe = /^\.+$/;
  var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
  var windowsTrailingRe = /[\. ]+$/;
  return input
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement);
}

class DenoResolver {
  constructor(prefix = path.join(process.cwd(), 'deno_modules')) {
    this.name = 'DenoResolver';
    this.prefix = prefix;
  }
  apply(compiler) {
    compiler.hooks.resolve.tapPromise(this.name, async (init, context) => {
      const callback = () => {};
      if (init.request.match(/^http(s)/)) {
        const url = init.request;
        const dir = init.request.split(path.sep).map(x => sanitize(x));
        const file = dir.pop();
        const fullFile = path.join(this.prefix, ...dir, file);
        init.request = fullFile;
        let fileExists = false
        try {
          const check = await fs.lstat(fullFile)
          fileExists = check.isFile()
        } catch (e) {

        }
        if (fileExists) {
          return compiler.doResolve(compiler.hooks.resolve, init, null, context, callback)
        }
        const fullDir = path.join(this.prefix, ...dir);
        const {data} = await axios.get(url);
        await fs.mkdirp(fullDir);
        await fs.writeFile(fullFile, data);
        return compiler.doResolve(compiler.hooks.resolve, init, null, context, callback)
      } else {
        return callback()
      }
    })
  }
}

module.exports = {
    mode: 'none',
    resolve: {
      plugins: [
        new DenoResolver()
      ]
    }
};