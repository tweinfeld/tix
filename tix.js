(function(Tix, _, window){

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
    Tix.stream = function(generator){
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
        var deliver = function(dt){
                _.invoke(subscribers, 'call', null, dt);
                dt instanceof TixEnd && voidStream();
            },
            value = _.flow(function(val){ return new TixValue(val); }, deliver),
            error = _.flow(function(val){ return new TixError(val); }, deliver),
            end = _.flow(function(val){ return new TixEnd(val); }, deliver);

        var activate = _.once(_.partial(generator,
            function(val){
                ((val instanceof TixValue || val instanceof TixEnd || val instanceof TixError) ? deliver : value)(val);
            },
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
                var args = _.toArray(arguments);
                addSubscriber(function(val){
                    console.log.apply(console, args.concat([logTemplate({ type: val.type, value: val.value() })]));
                });
                return interface;
            },
            take: function(count){
                var counter = 0;
                return Tix.stream(function(value, error, end){
                    var sub = function(rawVal){
                        value(rawVal);
                        (rawVal instanceof TixValue) && (++counter >= count) && end();
                    };
                    addSubscriber(sub);

                    return _.partial(removeSubscriber, sub);
                });
            },
            map: function(mapper){
                return Tix.stream(function(value){
                     var sub = function(rawVal){
                        value(rawVal instanceof TixValue ? mapper(rawVal.value()) : rawVal);
                     };

                    addSubscriber(sub);
                    return _.partial(removeSubscriber, sub);
                });
            },
            merge: function(stream){
                var streams = _.toArray(arguments);
                return Tix.stream(function(value){

                    var streamsRegistrars = _(streams).pluck('subscribe').push(addSubscriber).value();
                    var sendEnd = _.after(streamsRegistrars.length, value);
                    var handlers = _(streamsRegistrars).map(function(registrar){
                        var endOnce = _.once(sendEnd),
                            sub = function(rawVal){
                                rawVal instanceof TixEnd ? endOnce(rawVal) : value(rawVal);
                            };
                        registrar(sub);
                        return sub;
                    }).value();

                    return function(){
                        _(streams).pluck('unsubscribe').push(removeSubscriber).zip(handlers).forEach(function(arr){ arr[0](arr[1]); }).value();
                    }
                });
            },
            filter: function(filter){
                return Tix.stream(function(value){
                    var sub = function(rawVal){
                        if(rawVal instanceof TixValue){
                            filter(rawVal.value()) && value(rawVal.value());
                        } else {
                            value(rawVal);
                        }
                    };

                    addSubscriber(sub);
                    return _.partial(removeSubscriber, sub);
                });
            }
        };
        return interface;
    };

    Tix.fromCallback = function(generator){
        return Tix.stream(function(value, error, end){
            generator(function(val){
                value(val);
                end();
            });
        });
    };

    Tix.fromPoll = function(interval, poll){
        return Tix.stream(function(value){
            var timer;
            (function span(){
                timer = window.setTimeout(function(){
                    value(poll());
                    span();
                }, interval);
            })();

            return function(){
                clearInterval(timer);
            }
        });
    };

    Tix.mergeAll = function(){
        var args = _.toArray(arguments);
        return args.shift().merge.apply(null, args);
    };

    Tix.promise = function(generator){
       return new Tix.stream(function(value, error, end){
           generator(
               _.flow(value, end),
               _.flow(error, end)
           );
       });
    };

})(window["Tix"] = {}, _, window);
