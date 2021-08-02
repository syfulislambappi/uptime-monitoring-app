// dependencis
const {
    request
} = require('http')
const https = require('https')
const querystring = require('querystring')
const {
    twilio
} = require('./twilioInfo')

// module scaffolding
const notification = {}

// send sms to the user
notification.sendSms = (phone, msg, callback) => {
    // check user input
    const userPhone = typeof phone === 'string' && phone.trim().length === 11 ? phone.trim() : false
    const userMsg = typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1000 ? msg.trim() : false

    if (userPhone && userMsg) {
        // configure the payload request
        const payload = {
            From: twilio.fromPhone,
            To: `+880${userPhone}`,
            Body: userMsg
        }

        // convert payload to string
        const payloadString = querystring.stringify(payload)

        // configure the request details
        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }

        // start the request object
        const req = https.request(requestDetails, (res) => {
            // get the status code
            const status = res.statusCode

            // success message
            if (status === 200 || status === 201) {
                callback(false)
            } else {
                callback(`status code is ${status}`)
            }
        })

        req.on('error', (err) => {
            callback(err)
        })

        req.write(payloadString)
        req.end()
    } else {
        callback('invalid user parameter')
    }
}

// export the twilio
module.exports = notification