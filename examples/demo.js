// Create a custom stream from timer ticks
var stream = Tix.stream(function(value, error, end){
    console.log('Stream ACTIVATION routine!');
    var counter = 0;
    var timer = setInterval(function(){
        // Outputs either a value or an error
        _.sample([value, error])(counter++);
    }, 1000);

    /*var anotherTimer = setTimeout(function(){
        end('Done!');
    }, 4000);*/

    // Return a function for when a stream is deactivated
    return function(){
        console.log('Stream DEACTIVATION routine!');
        clearInterval(timer);
    };

});

var c = console.log.bind(console);
stream
    .filter(function(x){ return !(x % 2); })
    .map(function(x){ return x * 2; })
    .take(2)
    .onValue(function(val){ console.log('VALUE', val); });

//var callbackStream = Tix.fromCallback(function(cb){
//    setTimeout(function(){
//        cb('Callback was called');
//    }, 1000);
//}).log();

