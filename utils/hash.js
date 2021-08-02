// dependencies
const crypto = require('crypto')

// hash password
exports.hash = (str) => {
    if (typeof str === 'string' && str.trim().length > 0) {
        const hash = crypto.createHmac('sha256', 'hge;lghreoturrpghhre').update(str).digest('hex')
        return hash
    } else {
        return false
    }
}