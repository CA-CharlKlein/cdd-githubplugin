// Filename: service.js
// Creator: Charl Klein (CA Southern Africa)
//
// A Hooki.io Service to get the Import Github Content from a Specific Repository for CA Continious Delivery Director
// Service will respond to HTTP requests with a  JSON Formatted Document

// Node JS Module Definition
module['exports'] = function cddGithubHook(hook) {
    var host = hook.req.host;

    //Invoke our Request Handler
    requestHandler(hook);
};

// In this function we will Process the SOAP Call from CDD
function requestHandler(hook) {
    var request = require('request');

    // Extract the Parameters from the hook Object.
    var params = hook.params;
    var operation = hook.params.operation;

    // Switch Based on Operation Passed,
    // These are defined in Manifest.json
    switch (operation) {
        //Simple Connectivity Test to Github, to Validate Repo Onwer, Name and User-Agent
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

            // Define Connection Parameters
            var githubConnection = {
                url: 'https://api.github.com/repos/' + params.endPointProperties.repositoryOwner + '/' + params.endPointProperties.repository + '/issues',
                headers: {
                    'User-Agent': params.endPointProperties.userAgent
                }
            };

            // Execute Request to Git
            request.get({
                'url': githubConnection.url,
                'headers': githubConnection.headers
            }, function (err, res, body) {
                if (err) {

                    // Error Handling
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

                //Return Success Message :)
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

            // Define Github Connection with Query Sting Parameters
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

            // Execute Request to Git
            request.get({
                'url': githubConnection.url,
                'headers': githubConnection.headers,
                'qs': githubConnection.queryString
            }, function (err, res, body) {
                if (err) {

                    // Error Handling
                    var errorMessage = {
                        success: false,
                        errorMessage: err.messsage
                    }

                    hook.res.setHeader('content-type', 'application/json');
                    hook.res.end(JSON.stringify(errorMessage));
                }

                console.log(res.headers);

                // Rate Limiting Handler
                if (res.headers.status != "403 Forbidden") {

                    // Parse Response from Git
                    var elements = JSON.parse(body);

                    // Define Array for Content Items
                    var contentItems = [];

                    // Loop through Git issues and Complie array
                    elements.forEach(function (item) {
                        var includeItem = false;

                        // Add item to the Array
                        contentItems.push({
                            content: item.title,
                            type: ((params.contentSourceProperties.issueLabel.indexOf("bug") > -1) ? "DEFECT" : "TASK"),
                            displayType: item.labels[0].name,
                            status: item.state,
                            id: item.number,
                            externalId: item.id
                        })

                    })
                    // Define Output Object
                    var outputContent = {
                        contents: contentItems
                    }

                    //Resure response is application/json
                    hook.res.setHeader('content-type', 'application/json');
                    hook.res.end(JSON.stringify(outputContent));
                } else {

                    // Return Error for rate limiting
                    hook.res.statusCode = 400;
                    hook.res.end("Error - Rate Limit Hit");
                }
            })

            break;
        default:
            hook.res.statusCode = 400;
            hook.res.end("Error - No Operation Passed");
    }


}