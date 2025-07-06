const info = (...params : any[]) => {
    console.log(...params)
}

const error = (...params : any[]) => {
    console.log(...params)
}

module.exports = { info, error }