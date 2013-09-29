var express = require('express')
  , app = express()
  , server = require('http').createServer(app)

server.listen(4000);

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/test.html');
});
