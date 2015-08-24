# Tix - A Promise for a Better Reactive Experience

## Stream Creation

  * **stream(g(sink))** - For manually defining streams (using sink.value(), sink.error() and sink.end())
  * **fromCallback(g(cb))** - For cb(val) based streams
  * **fromNodeCallback(g(cb))** - For cb(err, val) based streams
  * **fromPoll(interval,g)** - For creating streams comprised of g() values on an interval.
  * **fromEvent(target, eventName, transform)** - For creating stream events out of an event emitter (addEventListener, on and bind are supported)
  * **sequentially(interval, sequence)** - For creating a streams based on sequenced values (repeated infinitely).
  * **later(interval, value)** - For creating one value stream after an interval.
  * **interval(interval, value)** - For creating recurring one value stream.
  
## Stream Transformation

  * **take(n)** - Takes n events
  * **first()** - Takes first event
  * **last()** - Takes last event (before [End])
  * **map(mapper)** - Applies mapper to stream values
  * **filter(filter)** - Filters stream values accoding to "filter(val)"
  * **merge(streams)** - Merges multiple streams
  * **delay(milliseconds)** - Adds a constant delay to stream 
  * **scan(scanFunctor, seed)** - Scans stream value-pairs, and applies a functor to them. If a seed is provided, it is used as the first value, otherwise the scan will beginning running starting the second value.
  * **onValue(listener)** - Calls listener on stream values (only values are handed)
  * **offValue(listener)**
  * **subscribe(subscriber)** - Receives "raw" Tix events of all types (value/error/end).
  * **unsubscribe**
