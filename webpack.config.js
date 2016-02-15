module.exports = {
  entry: "./src/ColorThief.js",
  output: {
    libraryTarget: "var",
    library: "ColorThief",
    path: __dirname + "/dist",
    filename: "color-thief.js"
  }
}
