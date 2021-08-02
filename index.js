// dependencies
const server = require('./lib/server')
const worker = require('./lib/worker')

// module scaffolding
const app = {}

//  run the application
app.run = () => {
    // start the server
    server.start()

    // start the worker
    worker.start()
}

// run application
app.run()