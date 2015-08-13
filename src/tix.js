var Tix = (function(console){

    var TixValue = {},
        TixError = {},
        TixEnd = {},
        TixLink = {};

    var tixTypeTemplate = function(type, value){
        var newTixObject = Object.create(type);
        newTixObject.value = value;
        return newTixObject;
    };

    var proxyStubTemplate = function(sink){
        return _.extend(sink, {
            value: _.compose(tixTypeTemplate.bind(undefined, TixValue), sink),
            error: _.compose(tixTypeTemplate.bind(undefined, TixError), sink),
            end: _.compose(tixTypeTemplate.bind(undefined, TixEnd), sink)
        });
    };

    var eventTrigger = (function(){
        var methods = {
            "addEventListener": function(target, eventName, handler){
                target.addEventListener(eventName, handler);
                return target.removeEventListener.bind(target, eventName, handler);
            },
            "on": function(target, eventName, handler){
                target.on(eventName, handler);
                return target.off.bind(target, eventName, handler);
            },
            "bind": function(target, eventName, handler){
                target.bind(eventName, handler);
                return target.unbind.bind(target, eventName, handler);
            }
        };

        var methodNames = Object.keys(methods);

        return function(target){
            var trigger = _.constant(_.noop);
            for(var i = 0; i < methodNames.length; i++){
                var methodName = methodNames[i];
                if(_.isFunction(target[methodName])){
                    trigger = methods[methodName].bind(undefined, target);
                    break;
                }
            }
            return trigger;
        }
    })();

    var subscriptionFactory = function(){
        return Object.create({
            add: function(subscriptionFunction){
                var subscribers = this.subscribers;
                subscribers.push(subscriptionFunction);
                subscribers.length && (this.onSubscriber)(subscriptionFunction);
                return this;
            },
            remove: function(subscriptionFunction){
                var subscribers = this.subscribers;
                subscribers.splice(subscribers.indexOf(subscriptionFunction), 1);
                !this.subscribers.length && this.onEmpty();
                return this;
            },
            reset: function(){
                this.subscribers.length = 0;
                this.onEmpty();
                return this;
            },
            publish: function(message){
                this.subscribers.forEach(function(thisSubscriber){ thisSubscriber.call(undefined, message); });
                return this;
            },
            onSubscriber: _.noop,
            onEmpty: _.noop
        }, {
            subscribers: {
                value: [],
                configurable: false
            }
        });
    };

    var typeCaptionTemplate = function(tixVal){
        return  [
            { "type": TixValue, "caption": "Value" },
            { "type": TixError, "caption": "Error" },
            { "type": TixEnd, "caption": "End" }
        ].filter(function(o){ return o.type.isPrototypeOf(tixVal); }).pop()["caption"];
    };

    var TixLinkFactory = function(generator, subscriptionModifiers){

        var subscribers = subscriptionFactory(),
            activator = _.once(generator.bind(undefined, proxyStubTemplate(function(val){ sink(val); }))),
            deactivator = _.noop,
            sink = function(val){
                subscribers.publish(val);
                TixEnd.isPrototypeOf(val) && (function(){
                    deactivator();
                    subscribers.reset();
                    sink = _.noop;
                })();
            };

        _.extend(subscribers, {
            onSubscriber: _.compose(function(subscriber){ deactivator = activator(); return subscriber; }, (subscriptionModifiers || {}).onSubscriber || _.noop),
            onEmpty: _.once(function(){ sink(Object.create(TixEnd)); })
        });

        var iface = _.extend(Object.create(TixLink), {
            log: function(){
                var args = _.argsToArray(arguments);
                subscribers.add(function(val){
                    console.log.apply(console, ["[" + typeCaptionTemplate(val) + "]"].concat(val.value ? [val.value].concat(args) : args));
                });
                return iface;
            },
            take: function(iterations){
                var counter = 0;
                return TixLinkFactory(function(sink){
                    var sub = function(val){
                        sink(val);
                        TixValue.isPrototypeOf(val) && (++counter >= iterations) && sink.end();
                    };
                    return subscribers.remove.bind(subscribers, subscribers.add(sub));
                });
            },
            first: function(){
                return iface.take(1);
            },
            last: function(){
                var lastValue = undefined;
                return TixLinkFactory(function(sink){
                    var sub = function(val){
                        TixValue.isPrototypeOf(val) && (lastValue = val);
                        TixEnd.isPrototypeOf(val) && !sink(lastValue) && sink(val);
                    };
                    return subscribers.remove.bind(subscribers, subscribers.add(sub));
                });
            },
            map: function(mapper){
                mapper = _.isFunction(mapper) ? mapper : _.constant(mapper);
                return TixLinkFactory(function(sink){
                    var sub = function(val){ TixValue.isPrototypeOf(val) ? sink.value(mapper(val.value)) : sink(val); };
                    return subscribers.remove.bind(subscribers, subscribers.add(sub));
                });
            },
            filter: function(filter){
                filter = _.isFunction(filter) ? filter : _.constant(false);
                return TixLinkFactory(function(sink){
                    var sub = function(val){  (!TixValue.isPrototypeOf(val) || filter(val.value)) && sink(val); };
                    return subscribers.remove.bind(subscribers, subscribers.add(sub));
                });
            },
            merge: function(){
                var args = _.argsToArray(arguments);

                return TixLinkFactory(function(sink){
                    var endSink = _.after(sink, args.length + 1);
                    var sinkFilter = function(val){
                        (TixEnd.isPrototypeOf(val) ? endSink : sink)(val);
                    };

                    [subscribers.add.bind(subscribers)]
                        .concat(args.map(function(stream){ return stream.subscribe; }))
                        .forEach(function(add){ add.call(undefined, sinkFilter); });

                    return function(){
                        [subscribers.remove.bind(subscribers)]
                            .concat(args.map(function(stream){ return stream.unsubscribe; }))
                            .forEach(function(remove){ remove.call(undefined, sinkFilter); });
                    };
                });
            },
            delay: function(milliseconds){
                var buffer = [];
                return TixLinkFactory(function(sink){
                    var timer,
                        sub = function(val){ TixValue.isPrototypeOf(val) ? (timer = setTimeout(sink.bind(sink, val), milliseconds)) : sink(val); }
                    return _.compose(subscribers.remove.bind(subscribers, subscribers.add(sub)), clearInterval.bind(window, timer));
                });
            },
            scan: function(scanFunctor, seed){
                return TixLinkFactory(function(sink){

                    var memo = seed,
                        counter = 0,
                        valueSink = function(val){ ((seed === undefined) && (!counter++)) ? memo = val : sink.value(memo = scanFunctor(memo, val)); },
                        sub = function(val){ TixValue.isPrototypeOf(val) ? valueSink(val.value) : sink(val); };

                    return subscribers.remove.bind(subscribers, subscribers.add(sub));
                });
            },
            onValue: function(listener){
                var sub = function(val){ TixValue.isPrototypeOf(val) && listener(val.value); };
                sub.ref = listener;
                subscribers.add(sub);
                return iface;
            },
            offValue: function(listener){
                subscribers.remove(subscribers.subscribers.filter(function(sub){ return sub.ref === listener })[0]);
                return iface;
            },
            subscribe: _.compose(subscribers.add.bind(subscribers), _.constant(iface)),
            unsubscribe: _.compose(subscribers.remove.bind(subscribers), _.constant(iface))
        });

        return iface;
    };

    var TixNS =  {
        stream: TixLinkFactory,
        fromNodeCallback: function(generator){
            return TixLinkFactory(function(sink){
                return generator(_.once(function(err, value){
                    err ? sink.error(err) : sink.value(value);
                    sink.end();
                }));
            });
        },
        fromCallback: function(generator){
            return TixNS.fromNodeCallback(function(cb){
                return generator(cb.bind(undefined, undefined));
            });
        },
        fromPoll: function(interval, generator){
            return TixLinkFactory(function(sink){
                var timer = setTimeout(function repeater(){
                    var val = generator();
                    val instanceof Error ? sink.error(val) : sink.value(val);
                    timer = setTimeout(repeater, interval);
                }, interval);

                return function(){
                    clearInterval(timer);
                };
            });
        },
        fromEvent: function(target, eventName, transform){
            transform = transform || _.identity;
            return TixLinkFactory(function(sink){
                return _.try(eventTrigger(target)(eventName, _.compose(transform, sink.value)));
            });
        },
        sequentially: function(interval, sequence){
            var seq = sequence.concat();
            return TixNS.fromPoll(interval, function(){
                return seq[seq.push(seq.shift())-1];
            });
        },
        later: function(interval, value){
            return TixNS.fromCallback(function(cb){
                var timer = setInterval(cb.bind(undefined, value), interval);
                return clearInterval.bind(undefined, timer);
            });
        },
        interval: function(interval, value){
            return TixNS.sequentially(interval, [value]);
        },
        scalar: function(value){
            var currentValue = value;
            return TixLinkFactory(_.noop, {
                onSubscriber: function(subscriber){
                    currentValue && subscriber(_.extend(Object.create(TixValue), { value: value }));
                }
            });
        }
    };

    return TixNS;
    
})(console);