// A Service to get the Import Github Content from a Specific Repository
// Service will respond to HTTP requests with a  JSON
module['exports'] = function cddGithubHook(hook) {
    // hook.req is a Node.js http.IncomingMessage
    var host = hook.req.host;
    // hook.res is a Node.js httpServer.ServerResponse
    // Respond to the request with a simple string

    requestHandler(hook);
};

// In this function we will Process the SOAP Call from CDD
function requestHandler(hook) {
    var request = require('request');

    var params = hook.params;
    var operation = hook.params.operation;



    console.log(params);



    switch (operation) {
        case 'connectivity-test':
            /* 
            SAMPLE REQUEST
            {
            "time": "2018-04-11T10:21:13.355Z",
            "data": {
            "operation": "connectivity-test",
            "executionId": "613971b9-0f09-4dbb-bd8f-80c66787b69d",
            "endPointProperties": {
                "repositoryOwner": "jacogreyling",
                "repository": "pexeso",
                "userAgent": "CA-CharlKlein"
            }
            },
            "ip": "162.243.187.144"
            } */

            var githubConnection = {
                url: 'https://api.github.com/repos/' + params.endPointProperties.repositoryOwner + '/' + params.endPointProperties.repository + '/issues',
                headers: {
                    'User-Agent': params.endPointProperties.userAgent
                }
            };

            request.get({
                'url': githubConnection.url,
                'headers': githubConnection.headers
            }, function (err, res, body) {
                if (err) {
                    var errorMessage = {
                        success: false,
                        errorMessage: err.messsage
                    }

                    hook.res.setHeader('content-type', 'application/json');
                    hook.res.end(JSON.stringify(errorMessage));
                }

                var successMessage = {
                    success: true,
                    errorMessage: 'null'
                }
                hook.res.setHeader('content-type', 'application/json');
                hook.res.end(JSON.stringify(successMessage));
            })
            break;
        case 'content-items':


            /* 
            SAMPLE REQUEST:
              {
                "time": "2018-04-11T11:12:28.382Z",
                "data": {
                "operation": "content-items",
                "endPointProperties": {
                    "repositoryOwner": "jacogreyling",
                    "repository": "pexeso",
                    "userAgent": "CA-CharlKlein"
                },
                "contentSourceProperties": {
                    "milestone": "2.0",
                    "issueLabel": "bug",
                    "issueState": "closed"
                },
                "executionId": "613971b9-0f09-4dbb-bd8f-80c66787b69d"
                },
                "ip": "162.243.187.144"
            }*/


            var githubConnection = {
                url: 'https://api.github.com/repos/' + params.endPointProperties.repositoryOwner + '/' + params.endPointProperties.repository + '/issues',
                headers: {
                    'User-Agent': params.endPointProperties.userAgent
                },
                queryString: {
                    'state': params.contentSourceProperties.issueState,
                    'labels': params.contentSourceProperties.issueLabel,
                    'milestone': ((params.contentSourceProperties.milestone == undefined) ? "*" : params.contentSourceProperties.milestone)
                }
            };

            request.get({
                'url': githubConnection.url,
                'headers': githubConnection.headers,
                'qs': githubConnection.queryString
            }, function (err, res, body) {
                if (err) {
                    var errorMessage = {
                        success: false,
                        errorMessage: err.messsage
                    }

                    hook.res.setHeader('content-type', 'application/json');
                    hook.res.end(JSON.stringify(errorMessage));
                }

                var elements = JSON.parse(body);

                var contentItems = [];

                elements.forEach(function (item) {
                    var includeItem = false;


                    contentItems.push({
                        content: item.title,
                        type: "DEFECT",
                        displayType: "Bug",
                        status: item.state,
                        id: item.number,
                        externalId: item.id
                    })

                })


                var quickcontent = {
                    contents: contentItems
                }

                hook.res.setHeader('content-type', 'application/json');
                hook.res.end(JSON.stringify(quickcontent));
            })

            break;
        default:
            hook.res.statusCode = 400;
            hook.res.end("Error - No Operation Passed");
    }


}