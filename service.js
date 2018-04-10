// A simple hello world microservice 
// Click "Deploy Service" to deploy this code
// Service will respond to HTTP requests with a string
module['exports'] = function cddGithubHook(hook) {
    // hook.req is a Node.js http.IncomingMessage
    var host = hook.req.host;
    // hook.res is a Node.js httpServer.ServerResponse
    // Respond to the request with a simple string


    makeRequest(hook);
   
};

function makeRequest(hook) {
    headers = {'User-Agent': 'CA-CharlKlein'};

    //'https://api.github.com/repos/jacogreyling/pexeso/issues'

    var request = require('request');
    
    request.get({
        'url': 'https://api.github.com/repos/jacogreyling/pexeso/issues',
        'headers': headers
    }, function (err, res, body) {
        if (err) {
            return hook.res.end(err.messsage);
        }

        var elements = JSON.parse(body);

        hook.res.end(elements.count());
    })

}