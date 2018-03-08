const express = require("express");
const app = express();





app.use(express.static(__dirname))

app.get("/user",(req,res)=>{
    console.log(req.query.username)
    res.send("user!");
})
app.post("/user",(req,res)=>{
    console.log(req.query);
    console.log(req.body);
    res.json(req.query)
})

const port = process.env.PORT || 8090;
module.exports = app.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}`);
})
