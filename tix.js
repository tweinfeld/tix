(function(Tix){

    // Data-type factory
    var typeFactory = function(typeName){
        var TixType = function(val){ this._val = val; };
        TixType.prototype = {
            value: function(){ return this._val; },
            type: typeName
        };
        return TixType;
    };

    // Tix's internal stream data-types
    var TixValue = typeFactory('value'),
        TixError = typeFactory('error'),
        TixEnd = typeFactory('end');

    // Tix's basic stream creation routine (rudimentary building block)
    Tix.create = function(generator){
        var _this = this;
        var voidStream = function(){
            deactivate();
            subscribers = [];
            addSubscriber = _.noop;
            removeSubscriber = _.noop;
            return true;
        };

        var subscribers = [];
        var deactivate = _.noop;
        var deliver = function(dt){ _.invoke(subscribers, 'call', null, dt); },
            value = _.flow(function(val){ return new TixValue(val); }, deliver),
            error = _.flow(function(val){ return new TixError(val); }, deliver),
            end = _.flow(function(val){ return new TixEnd(val); }, deliver, voidStream);

        var activate = _.once(_.partial(generator,
            function(val){ value(val); },
            function(val){ error(val); },
            function(val){ end(val); }));

        var addSubscriber = function(subscriber){
            deactivate = _.once(activate() || _.noop);
            subscribers.push(subscriber);
        };

        var removeSubscriber = function(subscriber){
            var index = subscribers.indexOf(subscriber);
            subscribers.splice.apply(subscribers, ~index ? [index, 1]: []);
            !subscribers.length && voidStream();
        };

        var interface = {
            subscribe: function (subscriber) {
                addSubscriber(subscriber);
            },
            unsubscribe: function (subscriber) {
                removeSubscriber(subscriber);
            },
            onValue: function(subscriber){
                var wrappedSubscriber = _.wrap(subscriber, function(sub, up){
                    up instanceof TixValue && sub(up.value());
                });

                wrappedSubscriber.original = subscriber;
                addSubscriber(wrappedSubscriber);
            },
            offValue: function(subscriber){
                removeSubscriber(_(subscribers).filter(function(s){ return s.original === subscriber; }).first());
            },
            log: function(){
                addSubscriber(function(val){
                    console.log(_.template('<<%-type%>> <%-value%>')({ type: val.type, value: val.value() }));
                });
                return interface;
            }
        };
        return interface;
    }

})(window["Tix"] = {});