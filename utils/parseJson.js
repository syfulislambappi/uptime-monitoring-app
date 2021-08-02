// parse JSON object
exports.parseJSON = (str) => {
    let output
    try {
        output = JSON.parse(str)
    } catch (e) {
        output = {}
    }
    return output
}