// dependencies
const http = require('http')
const handler = require('../handlers/handleReqRes')

// module scaffolding
const server = {}

// configuration
server.PORT = 8080 || process.env.PORT

// handle request response
server.handleReqRes = handler.handleReqRes

// create server
server.runServer = () => {
    const serverVariable = http.createServer(server.handleReqRes)
    serverVariable.listen(server.PORT, () => console.log(`server is running on port ${server.PORT}`))
}
// start function
server.start = () => {
    server.runServer()
}

// export the server
module.exports = server