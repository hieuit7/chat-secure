var d = true;
var RSAKey = require('/rsakey.js');
var BufferType = require('/buffer.js').Buffer;

var socket = io();
debug('Socket is: ',socket);
var myname = '';
var socketid = null;
var people = null;
var people_show = 'broadcast';
var room = null;
var room_show = null;
var Key = null;
var publicKey = null;
var serverKey = null;
var clientKey = null;
var session = false;


socket.on('connect',function(){
        console.log('connect to server');
        debug('connecting to server');
        Key = new RSAKey({b:512});
        publicKey = Key.exportKey('public');
        socketid = socket.id;
});

socket.emit('helloserver');

socket.on('helloclient',function(data){
        serverKey = data;
        debug('Server key: '+serverKey);


        Key.importKey(data,'public');
        debug('client key to send server: '+publicKey);
        var dataEncrypt = Key.encrypt(publicKey,'base64');
        debug('Send server encrypted public key: '+dataEncrypt);
        socket.emit('authenticationKey',dataEncrypt);
});

socket.on('authenticationRequest',function(data){
        debug('Recieve message sign server: '+data);
        debug('Importing server key to verify signiture: '+serverKey);
        Key.importKey(serverKey,'public');
        debug('Verify server!');
        var verified = Key.verify(publicKey,data,'utf-8','base64');
        if(verified){
                debug('Server is trusted!');
                //TODO reply server request!
                debug('Encrypt public key send to server!');
                Key.importKey(publicKey,'public');
                var sign = Key.sign(publicKey,'base64');
                socket.emit('authenticationReply',sign);

        }else{
                debug('Server is faked!');
                //TODO warning client with server is faked!! or reply server you is fake!!!
                socket.emit('authenticationReply','You is faker!');



        }


});

socket.on('clientScript',function(data){
        var html = '<script>';
        html += data;
        session = saveCookie('socket',socket.id,true);
        if(!session){
                var usernameen = encrypt(getCookie('username'));
                var socketid = encrypt(getCookie('socket'));
                socket.emit('joinserver',usernameen,socketid);
        }
        $('body').append(html);
});

socket.on('disconnect',function(){

        socket.close();
        //TODO save cookie
        debug('Dis connect save cookie');
        saveCookie('username',myname,true);

        debug('Dis connect save cookie');
});


/**
 *
 * @param data
 * @param client
 * @returns {*}
 */
function encrypt(data,client){
        debug('Encrypt data to send ',client);
        var encryptedData = null;
        if(client == undefined){
                Key.importKey(serverKey,'public');
                encryptedData = Key.encrypt(data,'base64');
        }else{
                Key.importKey(clientKey,'public');
                encryptedData = Key.encrypt(data,'base64');
        }
        Key.importKey(publicKey,'public');
        return encryptedData;
};
/**
 *
 * @param data
 * @param object
 * @returns {*}
 */
function decrypt(data,object){
        var decryptData = null;
        debug('Key for decrypt is '+data);
        Key.importKey(publicKey,'public');
        decryptData = Key.decrypt(data,(object)?'json':'utf8');
        debug('Data decrypted is ',decryptData);
        return decryptData;
};

/**
 *
 * @param name
 * @param value
 * @param end
 * @returns {boolean}
 */
function saveCookie(name,value,end){
        //document.cookie= name+'='+value+'; expires=Thu, 01 Jan 1970 00:00:00 UTC';
        if(checkCookie(name)&&end){

                debug('Cookie existed');
                return false;
        }
        debug('Cookie set');
        //document.cookie = name+'='+value;
        document.cookie= name+'='+value+'; expires=Thu, 01 Jan 2970 00:00:00 UTC';
        return true;
}

/**
 *
 * @param name
 * @returns {boolean}
 */
function checkCookie(name){
        var socketid=getCookie(name);

        if(socketid != "")
                return true;
        return false;
}
/**
 *
 * @param cname
 * @returns {string}
 */
function getCookie(cname){
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
}
/**
 * debug function
 * @param msg
 * @param object
 */
function debug(msg,object){
        if(d){
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









