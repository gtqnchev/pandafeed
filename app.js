var express = require("express");
var app = express();
var port = 3000;

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get("/", function(req, res){
    res.render("index");
});

app.get("/chat", function(req, res){
    res.render("chat");
});

app.listen(port);

console.log("Listening on port " + port);
