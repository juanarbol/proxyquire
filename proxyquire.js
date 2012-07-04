var path = require('path');

var config = { }; 

function getApi () {
  var self = {
    reset: function () { 
      Object.keys(config).forEach(function (x) { delete config[x]; });
      return module.exports;
    }
  }
  return self;
}

function addOverrides(mdl, name, resolvedName) {

  // Store it under the given name (resolvedName is only used to make real require work)
  if (!config[name]) {
    // configure entire module if it was not configured before
    config[name] = mdl;
  } else {
    // otherwise just reconfigure it by adding/overriding given properties
    Object.keys(mdl).forEach(function (key) {
      config[name][key] = mdl[key];
    });
  }
  
  // In strict mode we 'require' all properties to be used in tests to be overridden beforehand
  if (mdl.__proxyquire && mdl.__proxyquire.strict) return;

  // In non strict mode (default), we fill in all missing properties from the original module
  var orig = require(resolvedName);
  Object.keys(orig).forEach(function (key) {
    if (!mdl[key]) mdl[key] = orig[key];    
  });
}

function resolve (mdl, caller__dirname) {
  
  // Resolve relative file requires, e.g., './mylib'
  return  mdl.match(/^(\.|\/)/) ? 

    // We use the __dirname of the script that is requiring, to get same behavior as if real require was called from it directly.
    path.join(caller__dirname, mdl) : 
    
    // Don't change references to global or 'node_module' requires, e.g. 'path'
    mdl;

}

module.exports = function (arg) {
  
  var callerArgs = arguments.callee.caller.arguments
    , caller__dirname = callerArgs[4]
    ;
    
  // Three options:
  //   a) arg is string 
  //   b) arg is object
  //   c) no arg at all

  if (arg) {
    
    if (typeof arg === 'string') {

      var resolvedPath = resolve(arg, caller__dirname);

      // a) get overridden module or resolve it through original require
      return config[arg] ? config[arg] : require(resolvedPath);

    } else if (typeof arg === 'object') {
      
      // b) add more overrides
      Object.keys(arg).forEach(function (key) {

        var resolvedKey = resolve(key, caller__dirname);
        addOverrides(arg[key], key, resolvedKey); 

      });

    } else {

      throw new Exception('arg needs to be string or object');

    }
  } else {

    // c) allow configuration
    return getApi();

  }
};
