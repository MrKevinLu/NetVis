const express = require("express");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const config = require('./webpack.config.js');

const app = express();

const compiler = webpack(config);

app.use(webpackDevMiddleware(compiler,{
    publicPath: '/public/',
    stats:{
        colors:true,
        chunks:false
    }
}))

app.use(webpackHotMiddleware(compiler));

app.use(express.static(__dirname))
app.get("/user",(req,res)=>{
    res.send(req);
    res.send("user!");
})

const port = process.env.PORT || 8090;
module.exports = app.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}`);
})
