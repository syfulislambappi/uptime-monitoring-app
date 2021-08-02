// dependencies
const data = require('../handlers/databaseHandler')
const {
    parseJSON
} = require('../utils/parseJson')
const {
    hash
} = require('../utils/hash')
const {
    update
} = require('../handlers/databaseHandler')
const {
    verify
} = require('./token')

// module scaffolding
const handler = {}

// user route handler
handler.userHandler = (reqProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete']
    if (acceptedMethods.indexOf(reqProperties.method) > -1) {
        handler._user[reqProperties.method](reqProperties, callback)
    } else {
        callback(400, {
            mesasge: 'method not allowed'
        })
    }
}

// method scaffolding
handler._user = {}

// post method
handler._user.post = (reqProperties, callback) => {
    // check user data
    const Name = typeof reqProperties.body.Name === 'string' && reqProperties.body.Name.trim().length > 0 ? reqProperties.body.Name : false
    const Email = typeof reqProperties.body.Email === 'string' && reqProperties.body.Email.trim().length > 0 ? reqProperties.body.Email : false
    const Phone = typeof reqProperties.body.Phone === 'string' && reqProperties.body.Phone.trim().length === 11 ? reqProperties.body.Phone : false
    const Password = typeof reqProperties.body.Password === 'string' && reqProperties.body.Password.trim().length > 0 ? reqProperties.body.Password : false
    const Agree = typeof reqProperties.body.Agree === 'boolean' ? reqProperties.body.Agree : false

    // lookup data
    if (Name && Email && Phone && Password && Agree) {
        // check user
        data.read('users', Phone, (err) => {
            if (err) {
                // create user object
                const userObject = {
                    Name,
                    Email,
                    Phone,
                    Password: hash(Password),
                    Agree
                }
                // create user file
                data.create('users', Phone, userObject, (err) => {
                    if (!err) {
                        callback(200, {
                            message: 'user created succesfully'
                        })
                    } else {
                        callback(500, {
                            message: 'server side problem'
                        })
                    }
                })

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

// get method
handler._user.get = (reqProperties, callback) => {
    const Phone = typeof reqProperties.queryObject.Phone === 'string' && reqProperties.queryObject.Phone.trim().length === 11 ? reqProperties.queryObject.Phone : false
    if (Phone) {
        // check headers object
        const token = typeof reqProperties.headersObject.token === 'string' ? reqProperties.headersObject.token : false

        // verify with token
        verify(token, Phone, (tokenValue) => {
            if (tokenValue) {
                data.read('users', Phone, (err, data) => {
                    if (!err && data) {
                        const userObject = {
                            ...parseJSON(data)
                        }
                        delete userObject.Password
                        callback(200, userObject)
                    } else {
                        callback(500, {
                            message: 'server side problem'
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
            message: 'user not found'
        })
    }
}

// update method
handler._user.put = (reqProperties, callback) => {
    // check the data
    const Name = typeof reqProperties.body.Name === 'string' && reqProperties.body.Name.trim().length > 0 ? reqProperties.body.Name : false
    const Email = typeof reqProperties.body.Email === 'string' && reqProperties.body.Email.trim().length > 0 ? reqProperties.body.Email : false
    const Phone = typeof reqProperties.body.Phone === 'string' && reqProperties.body.Phone.trim().length === 11 ? reqProperties.body.Phone : false
    const Password = typeof reqProperties.body.Password === 'string' && reqProperties.body.Password.trim().length > 0 ? reqProperties.body.Password : false

    // lookup phone
    if (Phone) {
        if (Name || Email || Password) {

            // check headers object
            const token = typeof reqProperties.headersObject.token === 'string' ? reqProperties.headersObject.token : false

            // verify with token
            verify(token, Phone, (tokenValue) => {
                if (tokenValue) {
                    data.read('users', Phone, (err, data) => {
                        // parse data
                        const userObject = {
                            ...parseJSON(data)
                        }
                        if (!err && userObject) {
                            if (Name) {
                                userObject.Name = Name
                            }
                            if (Email) {
                                userObject.Email = Email
                            }
                            if (Password) {
                                userObject.Password = hash(Password)
                            }
                            update('users', Phone, userObject, (err) => {
                                if (!err && userObject) {
                                    callback(200, {
                                        message: 'user updated successfully'
                                    })
                                } else {
                                    callback(500, {
                                        message: 'sever side problem'
                                    })
                                }
                            })

                        } else {
                            callback(500, {
                                message: 'server side problem'
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
            callback(400, {
                message: 'you have a problem in your request'
            })
        }
    } else {
        callback(400, {
            message: 'you have a problem in your request'
        })
    }
}

// delete method
handler._user.delete = (reqProperties, callback) => {
    // check the data
    const Phone = typeof reqProperties.queryObject.Phone === 'string' && reqProperties.queryObject.Phone.trim().length === 11 ? reqProperties.queryObject.Phone : false

    // lookup data
    if (Phone) {
        // check headers object
        const token = typeof reqProperties.headersObject.token === 'string' ? reqProperties.headersObject.token : false

        // verify with token
        verify(token, Phone, (tokenValue) => {
            if (tokenValue) {
                // delete user
                data.delete('users', Phone, (err) => {
                    if (!err) {
                        callback(200, {
                            message: 'user is deleted successfully'
                        })
                    } else {
                        callback(500, {
                            message: 'server side problem'
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
            message: 'user not found'
        })
    }
}

// export route
module.exports = handler