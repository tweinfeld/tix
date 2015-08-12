var _ = {
    noop: function () {},
    identity: function(val){ return val; },
    constant: function(val){ return function(){ return val; } },
    isFunction: function(obj){ return typeof(obj) === "function"; },
    once: function(onceFunction){
        var cache = undefined, called = false;
        return function(){
            return called ? cache : (called = true) && (cache = onceFunction.apply(undefined, _.argsToArray(arguments)));
        };
    },
    try: function(func){
        return function(){
            var args = _.argsToArray(arguments);
            try { return func.apply(undefined, args); }
            catch(e) { return undefined; }
        }
    },
    argsToArray: function (args) {
        return Array.prototype.slice.call(args);
    },
    compose: function () {
        var args = _.argsToArray(arguments);
        return args.reduce(function (func, nextFunc) {
            return function () {
                return nextFunc(func.apply(undefined, _.argsToArray(arguments)));
            }
        }, args.shift());
    },
    extend: function () {
        var args = _.argsToArray(arguments);
        return args.reduce(function (source, ext) {
            Object.keys(ext).forEach(function (keyName) {
                source[keyName] = ext[keyName];
            });
            return source;
        }, args.shift());
    }
};