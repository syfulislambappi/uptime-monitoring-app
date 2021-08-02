// dependencies
const {
    userHandler
} = require('../routes/user')
const {
    tokenHandler
} = require('../routes/token')
const {
    checkHandler
} = require('../routes/checks')

// route handler
const route = {
    'user': userHandler,
    'token': tokenHandler,
    'check': checkHandler
}

// export route handler
module.exports = route