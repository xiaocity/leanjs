var AV = require('leanengine');
var AVUser = AV.Object.extend('CityUser');

module.exports = {
    // 注册一个用户
    create: function create(user) {
        var newUser = new AVUser();
        newUser.set('name', user.name);
        newUser.set('password', user.password);
        newUser.set('avatar', user.avatar);
        newUser.set('gender', user.gender);
        newUser.set('bio', user.bio);
        return newUser;
    }
};