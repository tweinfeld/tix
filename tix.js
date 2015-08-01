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

    var logTemplate = _.template('<<%-type%>> <%-value%>');

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
                    console.log(logTemplate({ type: val.type, value: val.value() }));
                });
                return interface;
            },
            take: function(count){
                var counter = 0;
                return Tix.create(function(value, error, end){
                    var sub = function(rawVal){
                        rawVal instanceof TixValue && value(rawVal.value());
                        rawVal instanceof TixError && error(rawVal.value());
                        rawVal instanceof TixEnd && end(rawVal.value());

                        (rawVal instanceof TixValue) && (++counter >= count) && end('ended');
                    };
                    addSubscriber(sub);

                    return function(){
                        removeSubscriber(sub);
                    };
                });
            }
        };
        return interface;
    };

    Tix.fromCallback = function(generator){
        return Tix.create(function(value, error, end){
            generator(function(val){
                value(val);
                end();
            });
        });
    }

})(window["Tix"] = {});
