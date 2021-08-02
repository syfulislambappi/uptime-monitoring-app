// module scaffolding
const handler = {}

// not found handler
handler.notFoundHandler = (reqProperties, callback) => {
    callback(404, {
        message: '404 page not found'
    })
}

// export not found handler
module.exports = handler