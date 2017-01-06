//jquery event

$(".modal#guess").modal({
        show:session,
        backdrop: "static"
});

$(".modal#login").on("hidden.bs.modal",function(e){
        if(user == null){
                $(".modal#register").modal({
                        show:!session,
                        backdrop: "static"
                });
        }else{
                console.log(user);
        }
});

$(".modal#guess").on("hidden.bs.modal",function(e){
        
});



$("#chat-name-btn").on('click',function(e){
        var name = $('#name').val();
        var data = encrypt(name);
        debug('User '+name+' Join server with encrypted username '+data);
        saveCookie('username',name);
        debug('Save cookie with '+name+' value '+getCookie('username'));
        socket.emit('joinserver',data);
});


$(document).ready(function(){

        $('div#peoples').on('click',function(e){
                debug("click", e.target.id);
                if(people_show){
                        $('#chatpanel_'+people_show).hide();
                }else if(room_show){
                        //leave temp room can join with existed message!
                        $('#chatpanel_'+room_show).hide();
                }else{

                }
                people = e.target.id;
                $('#chatpanel_'+people).show();
                people_show = people;
        });
        $('div#rooms').on('click',function(e){
                debug("click", e.target.name);
                if(people_show){
                        $('#chatpanel_'+people_show).hide();
                }else if(room_show){
                        //leave temp room can join with existed message!
                        $('#chatpanel_'+room_show).hide();
                }else{

                }
                room = e.target.name;
                $('#chatpanel_'+room).show();
                room_show = room;
        });
        $('#list a').on('click',function(){
                $(this).tab('show');
        });
        $('#list a:first').tab('show');
});

socket.on('joined',function(data){
        if(data){
                debug('recieve message encrypted username from server: '+data);
                var dataDecrypted = decrypt(data);
                $("#guess").modal('hide');
                myname = dataDecrypted;
                saveCookie('username',myname);

                $('#chatheading').empty().append("<p>Broadcast room!");
                //Debug for chrome not handle disconnect event
                debug('Save cookie socket id!! '+socketid);
                saveCookie('socket',socketid,false);
                //end debug for chrome not handle disconnect event
                socket.emit('update-peoples');
                socket.emit('update-rooms');
        }else{
                //TODO for username don't save in cookie
                debug('Null username!');
                $(".modal#guess").modal({
                        show:true,
                        backdrop: "static"
                });
        }
});

socket.on('update-peoples',function(data){
        debug('Recieve list peoples is encrypted!'+data);
        var peoples = decrypt(data,true);
        debug('peoples list is: ',peoples);
        var users = '<div class="list-group">';
        for(var key in peoples){
                var state = '';
                if(!peoples[key].state){
                        state = 'disabled';
                }
                users += '<a href="#" class="list-group-item '+state+'" id="'+peoples[key].id+'">';
                users += '<span class="badge">0' +
                '</span>' +peoples[key].name;
                users += '</a>';

        }

        users += '</div>';
        $('#peoples').empty().append(users);
});

socket.on('update-rooms',function(data){
        var rooms = decrypt(data,true);
        var room = '<div class="list-group">';

        for(var name in rooms){
                room += '<a>' +
                '<span class="badge">'+rooms[name].num+'</span>' + rooms[name].name+
                '</a>';
        }
        room += '</div>';

        $('#rooms').empty().append(room);
});

$('#btn-chat').on('click',function(){

        var message = $('#chat-input').val();
        if(people != null){
                var ms = '<div class="row"><div class="col-sm-2">Me:</div><div class="col-sm-10">'+message+'</div>';
                var messageEncrypted = encrypt(message);
                var peopleSendEncrypt = encrypt(people);
                socket.emit('message',messageEncrypted,peopleSendEncrypt);
                if(!$('#chatpanel_'+people).length){
                        var html = '<div class="row" id="chatpanel_'+people+'">';
                        html += '<div class="col-sm-12" id="chatpanel_'+people+'_body">';
                        html += ms;
                        html += '</div></div>';
                        $('#chatpanel_root').prepend(html);
                }else{
                        $('#chatpanel_'+people+'_body').prepend(ms);
                }

        }else if(room != null){
                var roomEncrypted = encrypt(room);
                var encrypted = encrypt(message);
                send('message',encrypted,roomEncrypted);
                //$('#chatpanel_'+room).prepend(ms);
        }else{
                //TODO for broadcast
                var encrypted = encrypt(message);
                send('message',encrypted);
        }

        $('#chat-input').val("");
                
});

$('#chat-input').on('keyup',function(key){
        if(key.keyCode == 13){                        
                $('#btn-chat').click();
        }
});


socket.on('message',function(msg,p,roomName){
        debug('Message is '+msg+' \npeople is '+ p+' \nroom name is '+roomName);
        var people_send = decrypt(p,true);
        var roomname = undefined;
        if(roomName)
                roomname = decrypt(roomName);
        debug('Rooms name is ',roomname);
        var pp = (people_send.name == myname)?'Me': people_send.name;
        var msgDecrypted = decrypt(msg);
        //message
        var ms = '<div class="row"><div class="col-sm-2">'+pp+':</div><div class="col-sm-10">'+msgDecrypted+'</div>';

        //TODO for edit

        if(roomname){
                //TODO for rooms message
                if($('#chatpanel_'+roomname).length){
                        //TODO for existed room
                        $('#chatpanel_'+roomname+'_body').prepend(ms);
                }else{
                        //TODO for non exist room

                }
                //room = roomname;
        }else{
                //TODO for private messsage
                if($('#chatpanel_'+people_send.id).length){
                        //TODO for existed people
                        $('#chatpanel_'+people_send.id+'_body').prepend(ms);

                }else{
                        //TODO for non exist people
                        var html = '<div class="row" id="chatpanel_'+people_send.id+'">';
                        html += '<div class="col-sm-12" id="chatpanel_'+people_send.id+'_body">';
                        html += '<div class="row"><div class="col-sm-2">'+pp+':</div><div class="col-sm-10">'+msgDecrypted+'</div>';
                        html += '</div></div>';
                        $('#chatpanel_root').prepend(html);
                }
                //people = people_send.id;
        }
        //old version!!
        /*if($('#chatpanel_'+people_send.id).length){
                debug('Panel',$('#chatpanel_'+people_send.id));
                $('#chatpanel_'+people_send.id+'_body').prepend(ms);
        }else{
                //TODO for add new conservation
                if(roomname){
                        if($('#chatpanel_'+roomname).length){
                                //TODO broadcast room
                                debug('recive ms broadcast existed!');
                                $('#chatpanel_'+roomname+'_body').prepend(ms);
                                if(roomname != 'broadcast')
                                        room = roomname;
                        }else{
                                //TODO for some another room!
                                debug('another room');
                        }
                }else{
                        var html = '<div class="row" id="chatpanel_'+people_send.id+'">';
                        html += '<div class="col-sm-12" id="chatpanel_'+people_send.id+'_body">';
                        html += '<div class="row"><div class="col-sm-2">'+pp+':</div><div class="col-sm-10">'+msgDecrypted+'</div>';
                        html += '</div></div>';
                        $('#chatpanel_root').prepend(html);
                }

        }
        if(people&&!roomname){
                $('#chatpanel_'+people).hide();
                people = people_send;
        }else if(roomname){
                $('#chatpanel_'+room).hide();
                if(room){
                        $('#chatpanel_'+room).show();
                        people = null;
                }else{
                        $('#chatpanel_broadcast').show();
                }
        }else{
                $('#chatpanel_broadcast').hide();
        }*/

        var msnum = $('a#notify').attr('count');
        msnum++;

        //TODO process for notify
        $('a#notify').empty().append('You have '+msnum+' messages!');
        $('a#notify').attr('count',msnum);


        $('#'+people_send.id).addClass('bg-primary');
});

socket.on('message_error',function(data){
        //TODO control for message!!
});




var send = function(event,data){
        console.log('send function trigged with event '+event);
        socket.emit(event,data);
}

var recieve = function(event,callback){
        console.log('recieve function trigged with event ' + event);

    socket.on(event,callback);
};



