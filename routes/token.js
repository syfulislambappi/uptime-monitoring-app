// dependencies
const data = require('../handlers/databaseHandler')
const {
    tokenId
} = require('../utils/tokenId')
const {
    parseJSON
} = require('../utils/parseJson')
const {
    hash
} = require('../utils/hash')
const {
    create,
    update
} = require('../handlers/databaseHandler')

// module scaffolding
const handler = {}

// token handler
handler.tokenHandler = (reqProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete']
    if (acceptedMethods.indexOf(reqProperties.method) > -1) {
        handler._token[reqProperties.method](reqProperties, callback)
    } else {
        callback(400, {
            message: 'method not allowed'
        })
    }
}

// method scaffolding
handler._token = {}

// post method
handler._token.post = (reqProperties, callback) => {
    // check data
    const Phone = typeof reqProperties.body.Phone === 'string' && reqProperties.body.Phone.trim().length === 11 ? reqProperties.body.Phone : false
    const Password = typeof reqProperties.body.Password === 'string' && reqProperties.body.Password.trim().length > 0 ? reqProperties.body.Password : false

    // lookup data
    if (Phone && Password) {
        // check user
        data.read('users', Phone, (err, data) => {
            const hashedPassword = hash(Password)
            const userObject = parseJSON(data)

            // validate password
            if (hashedPassword === userObject.Password) {
                // create token object
                const Id = tokenId(20)
                const expires = Date.now() + 60 * 60 * 1000
                const tokenObject = {
                    Id,
                    Phone,
                    expires
                }

                // store token object
                create('tokens', Id, tokenObject, (err) => {
                    if (!err && tokenObject) {
                        callback(200, tokenObject)
                    } else {
                        callback(500, {
                            message: 'internal server error'
                        })
                    }
                })
            } else {
                callback(400, {
                    message: 'password doesn\'t matched'
                })
            }
        })
    } else {
        callback(400, {
            message: 'you have a problem in your request'
        })
    }
}

// get method
handler._token.get = (reqProperties, callback) => {
    // check data
    const Id = typeof reqProperties.queryObject.Id === 'string' && reqProperties.queryObject.Id.trim().length === 20 ? reqProperties.queryObject.Id : false

    // lookup data
    if (Id) {
        // read token from database
        data.read('tokens', Id, (err, data) => {
            const tokenObject = parseJSON(data)
            if (!err && tokenObject) {
                callback(200, tokenObject)
            } else {
                callback(500, {
                    message: 'internal server error'
                })
            }
        })
    } else {
        callback(404, {
            message: 'token is not found'
        })
    }
}

// update method
handler._token.put = (reqProperties, callback) => {
    // check data
    const Id = typeof reqProperties.body.Id === 'string' && reqProperties.body.Id.trim().length === 20 ? reqProperties.body.Id : false
    const extend = typeof reqProperties.body.extend === 'boolean' && reqProperties.body.extend === true ? true : false

    // lookup data
    if (Id && extend) {
        // check token from database
        data.read('tokens', Id, (err, data) => {
            // parse token object
            const tokenObject = parseJSON(data)
            if (!err && tokenObject) {
                if (tokenObject.expires > Date.now()) {
                    // update token expires
                    tokenObject.expires = Date.now() + 60 * 60 * 1000
                    // store updated token in database
                    update('tokens', Id, tokenObject, (err) => {
                        if (!err) {
                            callback(200, {
                                message: 'token is updated successfully'
                            })
                        } else {
                            callback(500, {
                                message: 'intenal server error'
                            })
                        }
                    })
                } else {
                    callback(400, {
                        message: 'token is already expired'
                    })
                }
            } else {
                callback(500, {
                    message: 'server side problem'
                })
            }
        })
    } else {
        callback(400, {
            message: 'you have a problem in your request'
        })
    }
}

// delete method
handler._token.delete = (reqProperties, callback) => {
    // check data
    const Id = typeof reqProperties.queryObject.Id === 'string' && reqProperties.queryObject.Id.trim().length === 20 ? reqProperties.queryObject.Id : false

    // lookup data
    if (Id) {
        data.delete('tokens', Id, (err) => {
            if (!err) {
                callback(200, {
                    message: 'token is deleted successfully'
                })
            } else {
                callback(500, {
                    message: 'internal server error'
                })
            }
        })
    } else {
        callback(400, {
            message: 'you have a problem in your request'
        })
    }
}

// verify token
handler.verify = (Id, Phone, callback) => {
    // check the token from database
    data.read('tokens', Id, (err, data) => {
        const tokenObject = parseJSON(data)
        if (!err && tokenObject) {
            // match token data and user data
            if (tokenObject.Phone === Phone && tokenObject.expires > Date.now()) {
                callback(true)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}

// export token route
module.exports = handler