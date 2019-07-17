/* istanbul ignore file */
module.exports = function debug(id) {
  // check if peer dependency `debug` exists
  if (module_exists('debug')) {
    console.log('debug module exists!')
    return require('debug')(id)
  }
  else {
    console.log('debug module not exists :(')
    // if dev or debug is enabled
    if (process.env.NODE_ENV == 'development' || process.env.DEBUG && process.env.DEBUG.includes('telegraf:session-local')) {
      console.log('dev or debug mode enabled, so make console.log as alternative to debug module')
      return function debug() {
         console.log.call(this, id, arguments)
      }
    }
    // noop
    else return function () {}
  }
}

function module_exists(name) {
  try {
    return require.resolve(name)
  }
  catch(e) {
    return false
  }
}
