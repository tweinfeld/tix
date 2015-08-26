# Tix - A Promise for a Better Reactive Experience

## Stream Creation

The following methods are supported for a stream creation:

  * **Tix.stream(g(sink))** - Manually defining streams. The generator function `g` receives a sink object with three methods:
    * **sink.value(value)** - For sending value `value` into to stream.
    * **sink.error(value)** - For sending error into to stream.
    * **sink.end(value)** - For signaling that the stream should end.
  * **Tix.fromCallback(g(cb))** - Create a stream from a "regular" callback (e.g. `cb(val)`)
  * **Tix.fromNodeCallback(g(cb))** - Create a stream from a "node-style" callback (e.g. `cb(err, val)`)
  * **Tix.fromPoll(interval,g)** - Create a stream comprised of events generated by function `g` every `interval` milliseconds.
  * **Tix.fromEvent(target, eventName, transform)** - Create a stream events out of an event emitter (`addEventListener`, `on` and `bind` are supported)
  * **Tix.sequentially(interval, sequence)** - Create a streams based on sequenced values (repeated infinitely).
  * **Tix.later(interval, value)** - Creatie a one value stream following an interval of `interval` milliseconds.
  * **Tix.interval(interval, value)** - Creating a recurring constant value stream. Each event is `interval` milliseconds apart.
  
## Stream Transformation

The following methods are available on every stream, and allow multiple transformation to be applied to it:

  * **take(n)** - Takes n values, then end stream.
  * **first()** - Takes first value, then end stream.
  * **last()** - Takes very last value before a stream ends.
  * **map(mapper)** - Applies a `mapper` function to stream values.
  * **filter(filter)** - Applies a `filter` function to stream values, filters stream events accordingly.
  * **merge(streams)** - Merges one or multiple streams.
  * **delay(milliseconds)** - Adds a constant delay to values. 
  * **scan(scanFunctor, seed)** - Scans stream value-pairs, and applies a functor to them. If a seed is provided, it is used as the first value, otherwise the scan will beginning running starting the second value.
  * **onValue(listener)** - Registers `listener` for receiving a stream's values.
  * **offValue(listener)** - Unregisters `listener` for receiving a stream's values.
  * **onError(listener)** - Registers `listener` for receiving a stream's errors.
  * **offError(listener)** - Unregisters `listener` for receiving a stream's errors.
  * **onEnd(listener)** - Registers `listener` for receiving a stream's end.
  * **offEnd(listener)** - Unregisters `listener` for receiving a stream's end.
  * **subscribe(subscriber)** - Registeres `subscriber` for receiving raw Tix events of all types (value/error/end).
  * **unsubscribe** - Unregisteres `subscriber` for receiving raw Tix events of all types (value/error/end).
