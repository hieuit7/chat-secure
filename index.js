var Express = require('express');
var app = new Express();
var rsa = require('node-rsa');

var path = require('path');
var fs = require('fs');

var http = require('https');
var socket = require('socket.io')(http);





app.set('view engine','jade');
app.set('views',path.join(__dirname,'views'));
app.use(Express.static(__dirname+'/views'));

app.get('/views/js/jquery/jquery-1.11.1.js',function(req,res){
        var js = fs.readFileSync('./views/js/jquery/jquery-1.11.1.js');
        res.write(js);
        res.end();
});
app.get('/views/bootstrap/js/bootstrap.min.js',function(req,res){
        var js = fs.readFileSync('./views/bootstrap/js/bootstrap.min.js');

        res.write(js);
        res.end();
});
app.get('/views/bootstrap/css/bootstrap.min.css',function(req,res){
        var js = fs.readFileSync('./views/bootstrap/css/bootstrap.min.css');

        res.write(js);
        res.end();
});
app.get('/',function(req,res){

        var users = [{name:"Hieu",icon:"kk"},{name:"Hieu",icon:"kk"}];
        var clientScript = fs.readFileSync('./views/js/socket-client.js');
        var link = fs.readFileSync('./views/css/layout.css');

        var Buffer = fs.readFileSync('./views/js/crypto/Buffer.js');
        var RSAKey = fs.readFileSync('./views/js/crypto/RSAKey.js');
        
        
        //console.log(rsaScript);
        res.render('index',{
                script: '',
                link: link,
                title:'Socket IO',
                Buffer: Buffer,
                RSAKey: RSAKey,
                clientScript: clientScript,

                users: users

        });
});



module.exports = app;
