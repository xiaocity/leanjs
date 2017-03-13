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
    res.render('signin');
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {

    var name = req.fields.name;
    var password = req.fields.password;

    // 校验参数
    try {
        if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('名字请限制在 1-10 个字符');
        }
        if (password.length < 3) {
            throw new Error('密码至少 3 个字符');
        }

    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('/signin');
    }


    // 明文密码加密
    password = sha1(password);

    console.log("name:" + name);

    var query = new AV.Query(AVUser);
    query.equalTo('name', name);
    query.first().then(
        function (data) {
            if (data != null) {
                if (password == data.get('password')){
                    // 将用户信息存入 session
                    req.session.user = data;
                    // 写入 flash
                    req.flash('success', '登录成功');
                    // 跳转到首页
                    return res.redirect('/posts');
                }
                else {
                    req.flash('error', '用户名或密码错误');
                    return res.redirect('back');
                }
            }
            else{
                req.flash('error', '用户不存在');
                return res.redirect('back');
            }
        },
        function (error) {
            console.log("err msg:" + error.message)
        });

});

module.exports = router;