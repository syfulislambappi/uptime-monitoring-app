// dependencies
const data = require('../handlers/databaseHandler')
const {
    parseJSON
} = require('../utils/parseJson')
const {
    verify
} = require('./token')
const {
    tokenId
} = require('../utils/tokenId')
const {
    update,
    read
} = require('../handlers/databaseHandler')

// module scaffolding
const handler = {}

// check handler
handler.checkHandler = (reqProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete']
    if (acceptedMethods.indexOf(reqProperties.method) > -1) {
        handler._check[reqProperties.method](reqProperties, callback)
    } else {
        callback(405, {
            message: 'method not allowed'
        })
    }
}

// check method scaffolding
handler._check = {}

// check handler post method
handler._check.post = (reqProperties, callback) => {
    // validate user inputs
    const protocol = typeof reqProperties.body.protocol === 'string' && ['http', 'https'].indexOf(reqProperties.body.protocol) > -1 ? reqProperties.body.protocol : false
    const url = typeof reqProperties.body.url === 'string' && reqProperties.body.url.trim().length > 0 ? reqProperties.body.url : false
    const method = typeof reqProperties.body.method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(reqProperties.body.method) > -1 ? reqProperties.body.method : false
    const successCodes = typeof reqProperties.body.successCodes === 'object' && reqProperties.body.successCodes instanceof Array ? reqProperties.body.successCodes : false
    const timeoutSeconds = typeof reqProperties.body.timeoutSeconds === 'number' && reqProperties.body.timeoutSeconds % 1 === 0 && reqProperties.body.timeoutSeconds >= 1 && reqProperties.body.timeoutSeconds <= 5 ? reqProperties.body.timeoutSeconds : false

    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token = typeof reqProperties.headersObject.token === 'string' ? reqProperties.headersObject.token : false

        // lookup the user phone number from token
        data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = parseJSON(tokenData).Phone
                // lookup the user data
                data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        verify(token, userPhone, (tokenValue) => {
                            if (tokenValue) {
                                const userObject = parseJSON(userData)
                                const userChecks = typeof userObject.checks === 'object' && userObject.checks instanceof Array ? userObject.checks : []
                                if (userChecks.length < 5) {
                                    const checkId = tokenId(20)
                                    const checkObject = {
                                        id: checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds
                                    }
                                    // store the check object in database
                                    data.create('checks', checkId, checkObject, (err) => {
                                        if (!err) {
                                            // add check id to ther user's object
                                            userObject.checks = userChecks
                                            userObject.checks.push(checkId)

                                            // save the new user data
                                            data.update('users', userPhone, userObject, (err) => {
                                                if (!err) {
                                                    callback(200, checkObject)
                                                } else {
                                                    callback(500, {
                                                        message: 'there was a server side error'
                                                    })
                                                }
                                            })
                                        } else {
                                            callback(500, {
                                                message: 'there was a server side error'
                                            })
                                        }
                                    })

                                } else {
                                    callback(401, {
                                        message: 'user reached max check'
                                    })
                                }
                            } else {
                                callback(403, {
                                    message: 'Authentication failure'
                                })
                            }
                        })
                    } else {
                        callback(403, {
                            message: 'user not found'
                        })
                    }
                })
            } else {
                callback(403, {
                    message: 'Authentication problem'
                })
            }
        })
    } else {
        callback(400, {
            protocol,
            url,
            method,
            successCodes,
            timeoutSeconds
        })
    }
}

// check handler get method
handler._check.get = (reqProperties, callback) => {
    // check user data
    const id = typeof reqProperties.queryObject.id === 'string' && reqProperties.queryObject.id.trim().length === 20 ? reqProperties.queryObject.id : false

    // lookup the check
    if (id) {
        data.read('checks', id, (err, data) => {
            const checkData = parseJSON(data)
            if (!err && data) {
                const token = typeof reqProperties.headersObject.token === 'string' ? reqProperties.headersObject.token : false

                // verify token
                verify(token, checkData.userPhone, (tokenValue) => {
                    if (tokenValue) {
                        callback(200, checkData)
                    } else {
                        callback(403, {
                            message: 'authentication failure'
                        })
                    }
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

// check handler put method
handler._check.put = (reqProperties, callback) => {
    // check user data
    const id = typeof reqProperties.body.id === 'string' && reqProperties.body.id.trim().length === 20 ? reqProperties.body.id : false
    const protocol = typeof reqProperties.body.protocol === 'string' && ['http', 'https'].indexOf(reqProperties.body.protocol) > -1 ? reqProperties.body.protocol : false
    const url = typeof reqProperties.body.url === 'string' && reqProperties.body.url.trim().length > 0 ? reqProperties.body.url : false
    const method = typeof reqProperties.body.method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(reqProperties.body.method) > -1 ? reqProperties.body.method : false
    const successCodes = typeof reqProperties.body.successCodes === 'object' && reqProperties.body.successCodes instanceof Array ? reqProperties.body.successCodes : false
    const timeoutSeconds = typeof reqProperties.body.timeoutSeconds === 'number' && reqProperties.body.timeoutSeconds % 1 === 0 && reqProperties.body.timeoutSeconds >= 1 && reqProperties.body.timeoutSeconds <= 5 ? reqProperties.body.timeoutSeconds : false

    // lookup checks user
    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            data.read('checks', id, (err, data) => {
                const checkData = parseJSON(data)
                if (!err && checkData) {
                    const token = typeof reqProperties.headersObject.token === 'string' ? reqProperties.headersObject.token : false

                    // verify with token
                    verify(token, checkData.userPhone, (tokenValue) => {
                        if (tokenValue) {
                            if (protocol) {
                                checkData.protocol = protocol
                            }
                            if (url) {
                                checkData.url = url
                            }
                            if (method) {
                                checkData.method = method
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds
                            }
                            // store the updated check object
                            update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200, checkData)
                                } else {
                                    callback(500, {
                                        message: 'there was a internal server error'
                                    })
                                }
                            })
                        } else {
                            callback(403, {
                                message: 'authentication failure'
                            })
                        }
                    })
                } else {
                    callback(404, {
                        message: 'checks not found'
                    })
                }
            })
        } else {
            callback(400, {
                message: 'provide valid information'
            })
        }
    } else {
        callback(400, {
            message: 'you have a problem in your request'
        })
    }
}

// check handler delete method
handler._check.delete = (reqProperties, callback) => {
    // check user data
    const id = typeof reqProperties.queryObject.id === 'string' && reqProperties.queryObject.id.trim().length === 20 ? reqProperties.queryObject.id : false

    // delete function
    const deletes = data.delete

    // lookup the check data
    if (id) {
        // check the data
        data.read('checks', id, (err, data) => {
            const checkData = parseJSON(data)
            if (!err && data) {
                const token = typeof reqProperties.headersObject.token === 'string' ? reqProperties.headersObject.token : false

                // verify token
                verify(token, checkData.userPhone, (tokenValue) => {
                    if (tokenValue) {
                        // delete the checks
                        deletes('checks', id, (err) => {
                            if (!err) {
                                // lookup user data
                                read('users', checkData.userPhone, (err, data) => {
                                    const userObject = parseJSON(data)
                                    if (!err && userObject) {
                                        const userChecks = typeof userObject.checks === 'object' && userObject.checks instanceof Array ? userObject.checks : []

                                        // delete the check id from user's object
                                        const checkIndex = userChecks.indexOf(id)
                                        if (checkIndex > -1) {
                                            // delete check id
                                            userChecks.splice(checkIndex, 1)

                                            // resave the userchecks array
                                            userObject.checks = userChecks
                                            update('users', userObject.Phone, userObject, (err) => {
                                                if (!err) {
                                                    callback(400, {
                                                        message: 'checks deleted successfully'
                                                    })
                                                } else {
                                                    callback(500, {
                                                        message: 'there was a internal server error'
                                                    })
                                                }
                                            })
                                        } else {
                                            callback(500, {
                                                message: 'check id not found'
                                            })
                                        }
                                    } else {
                                        callback(500, {
                                            message: 'user not found with the checks'
                                        })
                                    }
                                })
                            } else {
                                callback(500, {
                                    message: 'internal server error'
                                })
                            }
                        })
                    } else {
                        callback(403, {
                            message: 'authentication failure'
                        })
                    }
                })
            } else {
                callback(404, {
                    message: 'checks data not found'
                })
            }
        })
    } else {
        callback(400, {
            message: 'you have a problem in your request'
        })
    }
}

// export checks route
module.exports = handler