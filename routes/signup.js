var fs = require('fs');
var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();
var checkNotLogin = require('../middlewares/check').checkNotLogin;

var AV = require('leanengine');
var AVUser = AV.Object.extend('CityUser');

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
    res.render('signup');
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {

    var name = req.fields.name;
    var gender = req.fields.gender;
    var bio = req.fields.bio;
    var avatar = req.files.avatar.path.split(path.sep).pop();
    var password = req.fields.password;
    var repassword = req.fields.repassword;

    // var query = new AV.Query(AVUser);
    // query.equalTo('name', name);
    // query.first().then(function (data) {
    //     console.log("return name:" + name);
    //     if (data != null){
    //         // console.log("return datas:" + datas.length);
    //         console.log("data name:" + data.get('name') +  " data ps:" + data.get('password'));
    //     }
    //     else {
    //         console.log("data is null");
    //     }
    // }, function (error) {
    //     console.log("error can not find user:" + name + " error:" + error.message);
    // });
    //
    // return res.redirect('/signup');

    // 校验参数
    try {
        if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('名字请限制在 1-10 个字符');
        }
        if (['m', 'f', 'x'].indexOf(gender) === -1) {
            throw new Error('性别只能是 m、f 或 x');
        }
        if (!(bio.length >= 1 && bio.length <= 130)) {
            throw new Error('个人简介请限制在 1-130 个字符');
        }
        if (!req.files.avatar.name) {
            throw new Error('缺少头像');
        }
        if (password.length < 3) {
            throw new Error('密码至少 3 个字符');
        }
        if (password !== repassword) {
            throw new Error('两次输入密码不一致');
        }
    } catch (e) {
        // 注册失败，异步删除上传的头像
        fs.unlink(req.files.avatar.path);
        req.flash('error', e.message);
        return res.redirect('/signup');
    }


    // 明文密码加密
    password = sha1(password);

    console.log("name:" + name);

    var query = new AV.Query(AVUser);
    query.equalTo('name', name);
    query.first().then(
        function (data) {
            if (data != null) {
                console.log('获取成功' + data.get('name') + "  " + data.get('password'));
                fs.unlink(req.files.avatar.path);
                req.flash('error', '用户名已被占用');
                return res.redirect('/signup');
            }
            else{
                console.log('用户名已可用');

                // 待写入数据库的用户信息
                var user = {
                    name: name,
                    password: password,
                    gender: gender,
                    bio: bio,
                    avatar: avatar
                };
                var newUser = new AVUser();
                newUser.set('name', user.name);
                newUser.set('password', user.password);
                newUser.set('avatar', user.avatar);
                newUser.set('gender', user.gender);
                newUser.set('bio', user.bio);

                // 用户信息写入数据库
                newUser.save().then(function (result) {
                    // 将用户信息存入 session
                    delete user.password;
                    req.session.user = user;
                    // 写入 flash
                    req.flash('success', '注册成功');
                    // 跳转到首页
                    res.redirect('/posts');
                })
                    .catch(function (e) {
                        // 注册失败，异步删除上传的头像
                        fs.unlink(req.files.avatar.path);
                        // 用户名被占用则跳回注册页，而不是错误页
                        if (e.message.match('E11000 duplicate key')) {
                            req.flash('error', '用户名已被占用');
                            return res.redirect('/signup');
                        }
                        next(e);
                    });
            }
    },
        function (error) {
            console.log("err msg:" + error.message)
    });

});

module.exports = router;