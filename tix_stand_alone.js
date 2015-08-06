(function(define){

    "use strict";

    var _ = {
        noop: function(){},
        argsToArray: function(args){ return Array.prototype.slice.call(args); },
        compose: function(){
            var args = _.argsToArray(arguments);
            return args.reduce(function(func, nextFunc){
                return function(){ return nextFunc(func.apply(undefined, _.argsToArray(arguments))); }
            }, args.shift());
        },
        extend: function(){
            var args = _.argsToArray(arguments);
            return args.reduce(function(source, ext){
                Object.keys(ext).forEach(function(keyName){ source[keyName] = ext[keyName]; });
                return source;
            }, args.shift());
        }
    };

    // Mixins
    var SubscriptionMixin = function(prot){
        var subscribers = [];
        return _.extend(prot, {
            addSub: function(sub){ subscribers.push(sub); (this._onAddSub || _.noop)(sub); },
            removeSub: function(sub){ subscribers.splice(subscribers.indexOf(sub), 1); },
            publish: function(message){ subscribers.forEach(function(sub){ sub.call(undefined, message); }); }
        });
    }

    //var MapTransformerMixin = function(){prot}

    var TixFactory = function(generator){
        return _.extend(
                _.compose(SubscriptionMixin)(Object.create(null)),
                {
                    "activator": generator.bind(undefined, function(sink){})
                }
            );
    };

    define(function(){

        return {
            create: TixFactory
        };


    });

})(function(window, tixFactory){
    window["Tix"] = tixFactory;
}.bind(undefined, window));