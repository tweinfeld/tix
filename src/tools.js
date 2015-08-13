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
    curry: function(func, ary){
        ary = ary || func.length;
        var accumulatedArgs = [];
        return function next(){
            return accumulatedArgs.push.apply(accumulatedArgs, _.argsToArray(arguments)) >= ary ? func.apply(undefined, accumulatedArgs) : next;
        }
    },
    after: function(func, count){
        var counter = 0;
        return function(){
            return (counter = Math.min(counter+1, count)) >= count ? func.apply(undefined, _.argsToArray(arguments)) : undefined;
        };
    },
    property: function(path){
        var section = function(field, source){ return source !== undefined ? source[field] : source; };
        return _.compose.apply(undefined, path.split('.').map(function(field){ return section.bind(undefined, field); }));
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