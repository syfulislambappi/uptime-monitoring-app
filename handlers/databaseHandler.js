// dependencies
const fs = require('fs')
const path = require('path')

// module scaffolding
const data = {}

// base path
const basePath = path.join(__dirname, '../.data/')

// create data
data.create = (dir, file, data, callback) => {
    // open file
    fs.open(`${basePath}${dir}/${file}.json`, 'wx', (err, fd) => {
        if (!err && fd) {
            const stringData = JSON.stringify(data)
            fs.writeFile(fd, stringData, (err) => {
                if (!err) {
                    fs.close(fd, (err) => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('there is a problem in closing file')
                        }
                    })
                } else {
                    callback('there is a problem in creating user')
                }
            })
        } else {
            callback('user is already existed')
        }
    })
}

// read data
data.read = (dir, file, callback) => {
    // read user
    fs.readFile(`${basePath}${dir}/${file}.json`, 'utf-8', (err, data) => {
        if (!err && data) {
            callback(err, data)
        } else {
            callback('user not found')
        }
    })
}

// update data
data.update = (dir, file, data, callback) => {
    // open user file
    fs.open(`${basePath}${dir}/${file}.json`, 'r+', (err, fd) => {
        if (!err && fd) {
            // covert buffer to string
            const dataString = JSON.stringify(data)
            // clear user file
            fs.ftruncate(fd, (err) => {
                if (!err) {
                    // recreate user file
                    fs.writeFile(fd, dataString, (err) => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('there is a problem in recreating user')
                        }
                    })
                } else {
                    callback('there is a problem in clearing user file')
                }
            })
        } else {
            callback('user not found')
        }
    })
}

// delete data
data.delete = (dir, file, callback) => {
    fs.unlink(`${basePath}${dir}/${file}.json`, (err) => {
        if (!err) {
            callback(false)
        } else {
            callback('there is a problem in deleting file')
        }
    })
}

// read all checks data
data.list = (dir, callback) => {
    fs.readdir(`${basePath}${dir}/`, (err, files) => {
        if (!err && files && files.length > 0) {
            const fileLists = []
            files.forEach(file => {
                fileLists.push(file.replace('.json', ''))
            })
            callback(false, fileLists)
        } else {
            callback('Erorror occurred in reading files')
        }
    })
}

// export data
module.exports = data