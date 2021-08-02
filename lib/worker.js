// dependencies
const url = require('url')
const http = require('http')
const https = require('https')
const {
    parseJSON
} = require('../utils/parseJson')
const {
    sendSms
} = require('../utils/notifications')
const data = require('../handlers/databaseHandler')
const {
    error
} = require('console')

// module scaffolding
const worker = {}

// gather all checks
worker.gatherAllChecks = () => {
    // get all checks
    data.list('checks', (err, checkFiles) => {
        if (!err && checkFiles && checkFiles.length > 0) {
            checkFiles.forEach(checkFile => {
                // read check from database
                data.read('checks', checkFile, (err, checkData) => {
                    if (!err && checkData) {
                        // validate check data
                        worker.validateCheckData(parseJSON(checkData))
                    } else {
                        console.list('error occurred in reading check')
                    }
                })
            })
        } else {
            console.log('couldnot find any check file')
        }
    })
}

// validate check data
worker.validateCheckData = (checkData) => {
    if (checkData && checkData.id) {
        checkData.state = typeof checkData.state === 'string' && ['up', 'down'].indexOf(checkData.state) > -1 ? checkData.state : 'down'
        checkData.lastcheckedTime = typeof checkData.lastcheckedTime === 'number' && checkData.lastcheckedTime > 0 ? checkData.lastcheckedTime : false

        // pass hit request funcation
        worker.hitRequest(checkData)
    } else {
        console.log('check invalid')
    }
}

// hit request
worker.hitRequest = (checkData) => {
    // prepare initial check outcome
    let checkOutCome = {
        error: false,
        responseCode: false
    }

    // mark the outcome has not been sent
    let outcomeSent = false

    // parse the hostname and full url from the original data
    const parseUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true)
    const {
        hostname,
        path
    } = parseUrl

    // request object
    const requestDetails = {
        protocol: `${checkData.protocol}:`,
        hostname,
        method: checkData.method.toUpperCase(),
        path,
        timeout: checkData.timeoutSeconds * 1000
    }

    const protocolToUse = checkData.protocol === 'http' ? http : https

    const req = protocolToUse.request(requestDetails, (res) => {
        // set the status code
        const status = res.statusCode
        // update the check outcome and call the next function
        checkOutCome.responseCode = status
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutCome)
            outcomeSent = true
        }
    })

    req.on('error', (err) => {
        checkOutCome = {
            error: true,
            value: err
        }
        // update the check outcome and pass the next process
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutCome)
            outcomeSent = true
        }
    })

    req.on('timeout', () => {
        checkOutCome = {
            error: true,
            value: 'timeout'
        }
        // update the checkoutcome and pass the next process
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutCome)
            outcomeSent = true
        }
    })

    // req send
    req.end()
}

// save check outcome to database
worker.processCheckOutcome = (checkData, checkOutCome) => {
    const state = !checkOutCome.error && checkOutCome.responseCode && checkData.successCodes.indexOf(checkOutCome.responseCode) > -1 ? 'up' : 'down'

    // should alert or not
    const alertWanted = !!(checkData.lastcheckedTime && checkData.state !== state)

    // update the check data
    const newCheckData = checkData
    newCheckData.state = state
    newCheckData.lastcheckedTime = Date.now()

    // update the database
    data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alertWanted) {
                worker.alertUser(newCheckData)
            } else {
                console.log('no need to give alert')
            }
        } else {
            console.log('error occurred to save the check data')
        }
    })
}

// alert user
worker.alertUser = (newCheckData) => {
    const msg = `given method is ${newCheckData.method}, website is ${newCheckData.protocol}://${newCheckData.url} is now ${newCheckData.state}.`

    sendSms(newCheckData.userPhone, msg, (err) => {
        if (!err) {
            console.log('user was alerted for changing status of the site', msg)
        } else {
            console.log('there was a problem in sending sms')
        }
    })
}

// check the website after several times
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks()
    }, 1000 * 6)
}

// start function
worker.start = () => {
    // run all checks
    worker.gatherAllChecks()

    // run the worker after several times
    worker.loop()
}

// export the worker
module.exports = worker