/**
 * Created by hieu on 2/6/15.
 * new version for secure
 */

var fs = require('fs');
var server = require('https');
var index = require('./index.js');
var options = {
    key: fs.readFileSync('./key/key.pem'),
    cert: fs.readFileSync('./key/key_cert.pem')
};
var http = server.createServer(options,index);
var io = require('socket.io')(http);

//var mongodb = require('mongoose');


//mongodb.connect('mongodb://localhost/chat');

var Users = require('./model/user.js');
var cryptor = require('node-rsa');
// var sys = require('sys');
//sys.puts(cryptor);


//var crypto = require('crypto');
var _ = require('underscore');

var friends = {};
var rooms = {};

var peoples = {};
var rooms = {};

var RSA = require('node-rsa');

var keys = {};
var i = 0;
var messages = {};

var Key = new RSA({b:512});

var serverPub = Key.exportKey('public');
var serverPrivate = Key.exportKey('private');

io.on('connection',function(socket){


    //authentication client
    var republicKey = null;
    var id = null;

    socket.on('helloserver',function(data){
        debug('Send client Public key: '+serverPub);
        //createRooms('haha',socket);
        socket.emit('helloclient',serverPub);
    });
    socket.on('authenticationKey',function(data){
        debug('Recieve message contain client\'s public key: '+data);
        Key.importKey(serverPub,'public');
        var public = Key.decrypt(data);
        debug('public key recieve from client is: '+public);
        republicKey = public;
        var sign = Key.sign(public,'base64');
        debug('authentication with signiture: '+sign);
        socket.emit('authenticationRequest',sign);
    });

    socket.on('authenticationReply',function(data){
        if(data != 'You is faker!'){

            Key.importKey(republicKey,'public');
            if(Key.verify(republicKey,data,'utf-8','base64')){

                addClientKey(republicKey,socket.id);
                debug('Key added!',keys);
                var script = fs.readFileSync('./views/js/login.js');
                socket.emit('clientScript',script.toString());

            }else{


            }

        }else{
            //TODO something with faker
        }


    });

    socket.on('joinserver',function(username,socketid){
        var usernameDecrypted = decrypt(username);
        var socketId = null;
        if(socketid != undefined){
            //TODO event submited with username;
            socketId = decrypt(socketid);
            id = socketId;
        }
        //check username existed in server;
        var exist = false;
        var noauthen = true;
        for(var index in peoples){
            if(peoples[index].name == usernameDecrypted){
                debug('Socket id old'+socketId+' Socket id new '+peoples[index].socket);
                if(socketId == peoples[index].socket){
                    peoples[index].socket = socket.id;
                    peoples[index].state = true;
                    noauthen = false;
                }
                exist = true;
                break;
            }
        }
        if(!exist||noauthen){
            //debug('Username is '+usernameDecrypted,usernam);
            if(usernameDecrypted.length == 0 || !noauthen || exist){
                debug('Emit event null username!');
                //TODO process with username null
                socket.emit('joined');
            }else{
                addPeoples(usernameDecrypted,socket,socket.id);
                var dataEncrypted = encrypt(usernameDecrypted,socket.id);
                socket.emit('joined',dataEncrypted);
                debug('Joined server with don\'t existed in server!',peoples);
            }

        }else{
            //TODO for join server with existed session!
            //debug('Existed user',_.findWhere(peoples,{socket:socket.id}));
            var dataEncrypted = encrypt(usernameDecrypted,socket.id);
            socket.emit('joined',dataEncrypted);
            debug('Joined server with existed in server!',peoples);
        }
    });

    socket.on('message',function(msg,to){
        debug('Recieve '+msg+' to '+to);
        var decryptMsg = decrypt(msg);

        if(toDecrypt != undefined){
            var toDecrypt = decrypt(to);
            //TODO for private message
            privateMessage('message',decryptMsg,socket.id,toDecrypt);
        }else{
            //TODO for broadcast
            var decryptMsg = decrypt(msg);
            debug('Message from client is '+decryptMsg);
            broadcast('message',decryptMsg,socket.id,'broadcast');

        }
    });

    socket.on('create-room',function(room){
        var roomName = decrypt(room);
        createRooms(roomName,socket);
    });

    socket.on('update-rooms',function(){
        debug('Rooms update');
        broadcast('update-rooms',rooms);
    });

    socket.on('update-peoples', function (sign) {
        broadcast('update-peoples',peoples);
    });

    socket.on('disconnect',function(){
        delete keys[socket.id];
        var people = _.findWhere(peoples,{socket:socket.id});
        if(people != undefined){
            changeStatePeople(people.id,false);
        }
        broadcast('update-peoples',peoples);
    });

});

function createRooms(roomName,socket){
    debug('Room '+roomName+ ' have created!!',rooms);
    debug('List room',io.sockets.adapter.rooms);
    var exist = false;
    for(var index in rooms){
        if(rooms[index].name == roomName){
            var encrypted = encrypt('false',socket.id);
            socket.emit('createRoom',encrypted);
            exist = true;
            break;
        }
    }
    if(!exist){
        rooms[roomName] = {name:roomName,num:0};
        io.sockets.adapter.rooms[roomName] = {};
        debug('List room',rooms);
        socket.emit('update-rooms',rooms);
    }

}


/**
 * Add people to list!
 * @param people people's name to add!
 * @param s socket for this people
 */

function addPeoples(people,s,id){
    peoples[s.id] = {
        name: people.toString(),
        id: id,
        socket: s.id,
        state:true
    };
};
/**
 *
 * @param people
 * @param state
 * @returns {*}
 */
function changeStatePeople(people,state){
    peoples[people].state = state;
}
/**
 * broadcast to all client
 * @param event
 * @param data
 * @param from
 */
function broadcast(event,data,from,roomname,to){
    var username = _.findWhere(peoples,{socket:from});

    debug('peoples send is '+from+'\n to '+roomname,username);
    //TODO broadcast to all client
    var keyList = (to == undefined)?keys:to;

    for(var index in keyList){
        var dataEncrypt = encrypt(data,index);

        if(username == null){
            io.sockets.connected[index].emit(event,dataEncrypt);
        }else{
            var usernames = encrypt(username,index);
            var roomEncrypt = encrypt(roomname,index);
            io.sockets.connected[index].emit(event,dataEncrypt,usernames,roomEncrypt);
        }
    }



}
/**
 *
 * @param event
 * @param data
 * @param from
 * @param to
 */
function privateMessage(event,data,from,to){
    //TODO for private message
    if(peoples[to].state){
        debug('Event '+event+' data '+data+' from '+from+' to'+to);
        var dataEncrypted = encrypt(data,peoples[to].socket);
        var peoplenEcrypted = encrypt(_.findWhere(peoples,{socket:from}),peoples[to].socket);
        io.sockets.connected[peoples[to].socket].emit(event,dataEncrypted,peoplenEcrypted);
    }else{
        //TODO offline message
    }

}
/**
 *
 * @param clientKey
 * @param client
 */
function addClientKey(clientKey,client){
    keys[client] = {key:clientKey};
    ////debug('Client '+clientKey+' added with ',client);
}
/**
 *
 * @param data
 * @param client
 * @returns {*}
 */
function encrypt(data,client){
    var encrypted = null;
    if(client != null){
        debug('Client read key is: '+client);
        debug('Key is: ',keys);
        Key.importKey(keys[client].key,'public');
        encrypted = Key.encrypt(data,'base64');
    }else{

    }
    return encrypted;
}
/**
 *
 * @param data
 * @param object
 * @returns {*}
 */
function decrypt(data,object){
    var decrypted = null;
    Key.importKey(serverPub,'public');
    decrypted = Key.decrypt(data,(object)?'json':'utf8');
    return decrypted;
}

/**
 *
 * @param data
 */
function sign(data){

}
/**
 *
 * @param msg
 * @param object
 */
function debug(msg,object){

    if(process.argv[2] == '-d'){
        if(msg != undefined){
            if(object != undefined){
                console.log(msg+' :');
                console.log(object);
                console.log('-----------------//----------------------------');
            }else{
                console.log(msg);
            }
        }else if(object != undefined){
            console.log('----------------------//------------------------------');
            console.log(object);
            console.log('----------------------//------------------------------');
        }
    }else{

    }
}
http.listen(9999);

