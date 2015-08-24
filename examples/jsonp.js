// ** Rudimentary JSONP call function - A demo by Tal Weinfeld **
function jsonp(url, cb, receiverParameterName){

    var receiverName = _(_.range(10)).map(_.partial(_.sample,"abcdefghijklmnopqrstuvexyzABCDEFGHIJKLMNOPRQAT",1)).join(''),
        urlSplit = url.split('?'),
        cbWrapper = _.once(_.flow(cb || _.noop, function(){ window[receiverName] = undefined; }));

    window[receiverName] = _.partial(cbWrapper, null);
    setTimeout(_.partial(cbWrapper, new Error('Connection timed out')), 3000);

    var script = document.createElement('script');
    script.src = [urlSplit.shift()]
        .concat(
        urlSplit
            .map(function(str){ return str.split('&') })
            .concat([receiverParameterName || "callback", receiverName].join('='))
            .join('&')
    ).join('?');
    document.querySelector('body').appendChild(script);
}