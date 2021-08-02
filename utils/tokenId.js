exports.tokenId = (length) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz1234567890'
    let output = ''
    for (let i = 0; i < length; i++) {
        const randomChar = Math.floor(Math.random() * characters.length)
        const char = characters.charAt(randomChar)
        output += char
    }
    return output
}