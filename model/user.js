var mongoose =  require('mongoose');

var User = mongoose.Schema;

var Users = new User({
        name: String,
        pass: String,
        icon: String,
        friends: Array,
        rooms: Array
});
Users.index({name:1});
Users.set('autoIndex', false);

module.exports = mongoose.model('Users',Users);
