// dependencies
const url = require('url')
const {
    StringDecoder
} = require('string_decoder')
const {
    parseJSON
} = require('../utils/parseJson')
const route = require('./routeHandler')
const {
    notFoundHandler
} = require('../routes/notFound')
const {
    type
} = require('os')

// module scaffolding
const handler = {}

// handle request response
handler.handleReqRes = (req, res) => {
    // request data
    const parsedUrl = url.parse(req.url, true)
    const path = parsedUrl.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')
    const queryObject = parsedUrl.query
    const headersObject = req.headers
    const method = req.method.toLowerCase()
    const reqProperties = {
        parsedUrl,
        path,
        trimmedPath,
        queryObject,
        headersObject,
        method
    }

    // handle routes
    const chosenHandler = route[trimmedPath] ? route[trimmedPath] : notFoundHandler

    // buffer data from request
    const decoder = new StringDecoder('utf-8')
    let bufferData = ''
    req.on('data', (chunk) => {
        bufferData += decoder.write(chunk)
    })

    req.on('end', () => {
        reqProperties.body = parseJSON(bufferData)
        chosenHandler(reqProperties, (statusCode, payload) => {
            statusCode = typeof statusCode === 'number' ? statusCode : 500
            payload = typeof payload === 'object' ? payload : {}

            // convert payload to string
            const payloadString = JSON.stringify(payload)

            // response processing
            res.setHeader('content-type', 'application/json')
            res.writeHead(statusCode)
            res.end(payloadString)
        })
    })
}

// export module
module.exports = handler