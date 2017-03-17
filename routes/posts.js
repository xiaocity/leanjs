var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var checkLogin = require('../middlewares/check').checkLogin;

var AV = require('leanengine');
var Post = AV.Object.extend('Post');

// GET /posts 所有用户或者特定用户的文章页
//   eg: GET /posts?author=xxx
router.get('/', function(req, res, next) {
    if (req.session.user == null) {
        console.log("not login");
        res.send(req.flash());
    } else {
        var author = req.session.user.objectId;
        console.log("author:" + author);
        var mymsg  = "";
        for (var i in  req.session.user) {
            if(req.session.user.hasOwnProperty(i)){
                mymsg += "userinfo" + "." + i + "=" + req.session.user[i] + "\n";
            }
        }
        console.log(mymsg);

        var user = req.session.user;
        var query = new AV.Query(Post);
        query.equalTo('author', author);
        query.find().then(function (results) {
            console.log(eval(results));
            var myjson = JSON.stringify(results);
            console.log(myjson);
            console.log("=========================");
            console.log(results);

            var jsObj = eval( "(" + myjson + ")" );//转换后的JSON对象

            var posts = new Array();
            for (var i in results) {
                var mymsg  = "";
                for (var j in results[i]){
                    var post = results[i];
                    if(post.hasOwnProperty(j)){
                        mymsg += "posts" + "[" + i + "]" +  "." + j + "=" + post[j]+ "\n";
                    }
                }
                mymsg += "content:" + results[i].get('content');
                console.log(mymsg);
                var post = {
                    objectId : results[i].get('objectId'),
                    author : results[i].get('author'),
                    title : results[i].get('title'),
                    content : results[i].get('content'),
                    pv : results[i].get('pv'),
                    createdAt : results[i].get('createdAt')
                };

                // var postnew = results[i].attributes;
                //
                // mymsg  = "";
                // for (var i in postnew) {
                //     if(postnew.hasOwnProperty(i)){
                //         mymsg += "postnew" + "." + i + "=" + postnew[i] + "\n";
                //     }
                // }
                // console.log(mymsg);
                //
                // postnew = results[i].attributes;
                //
                // mymsg  = "";
                // for (var i in postnew) {
                //     if(postnew.hasOwnProperty(i)){
                //         mymsg += "postnew" + "." + i + "=" + postnew[i] + "\n";
                //     }
                // }
                // console.log(mymsg);

                mymsg = "";
                mymsg = "id:" + post.objectId + " author:" + post.author + " title:" + post.title +  " createdAt:" + post.createdAt + "\n";
                console.log(mymsg);

                posts[i] = post;
            }


            res.render('posts', {
                author: user,
                posts: jsObj
            });
        }, function (error) {
            res.send(req.flash());
        });
    }
    // res.send(req.flash());
});

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function(req, res, next) {
    res.render('create');
});

// POST /posts 发表一篇文章
router.post('/', checkLogin, function(req, res, next) {

    var mymsg  = "";
    for (var i in req.session.user) {
        if(req.session.user.hasOwnProperty(i)){
            mymsg += "data" + "." + i + "=" + req.session.user[i] + "\n";
        }
    }
    console.log(mymsg);


    var author = req.session.user.objectId;
    var title = req.fields.title;
    var content = req.fields.content;

    // 校验参数
    try {
        if (!title.length) {
            throw new Error('请填写标题');
        }
        if (!content.length) {
            throw new Error('请填写内容');
        }
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('back');
    }

    // var post = {
    //     author: author,
    //     title: title,
    //     content: content,
    //     pv: 0
    // };

    console.log("author:" + author + " title:" + title + " content:" + content);

    var newPost = new Post();
    newPost.set('author', author);
    newPost.set('title', title);
    newPost.set('content', content);
    newPost.set('pv', 0);

    // 用户信息写入数据库
    newPost.save().then(function (result) {
        if (result == null) {
            req.flash('failed', '发表失败');
            // 发表成功后跳转到该文章页
            res.redirect('back');
        } else {
            var postId = result.get('objectId');
            console.log("postId:" + postId);
            req.flash('success', '发表成功');
            // 发表成功后跳转到该文章页
            // res.redirect('/posts/${postId}');
            res.redirect(`/posts/${postId}`);
        }
    })
       .catch(next);
});

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function(req, res, next) {
    var postId = req.params.postId;
    // var avPost = AV.Object.createWithoutData('Post', postId);
    // avPost.increment('pv',1);
    // // avPost.fetchWhenSave(true);
    // avPost.save().then(function (post) {
    //     if (post == null){
    //         req.flash('fail', '获取文章失败');
    //     }
    //     else {
    //         var user = req.session.user;
    //         post.increment('pv',1);
    //         // 成功获得实例
    //         var jsonPost = JSON.stringify(post);
    //         console.log(jsonPost);
    //         var jsPost = eval( "(" + jsonPost + ")" );//转换后的JSON对象
    //         res.render('post', {
    //             author: user,
    //             post: jsPost
    //         });
    //     }
    // }, function (error) {
    //     // 异常处理
    //     req.flash('fail', '获取文章失败');
    // });

    var query = new AV.Query(Post);
    query.get(postId).then(function (post) {
        if (post == null){
            req.flash('fail', '获取文章失败');
        }
        else {
            var user = req.session.user;
            post.increment('pv',1);
            // 成功获得实例
            var jsonPost = JSON.stringify(post);
            console.log(jsonPost);
            var jsPost = eval( "(" + jsonPost + ")" );//转换后的JSON对象
            res.render('post', {
                post: jsPost
            });
            post.save().then(function (post) {
                
            })
        }
    }, function (error) {
        // 异常处理
        req.flash('fail', '获取文章失败');
    });
});

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function(req, res, next) {
    console.log("in postid edit")
    var postId = req.params.postId;
    var author = req.session.user.objectId;

    var query = new AV.Query(Post);
    query.get(postId).then(function (post) {
        if (post == null){
            req.flash('fail', '获取文章失败');
        }
        else {
            var user = req.session.user;
            var jsonPost = JSON.stringify(post);
            console.log(jsonPost);
            var jsPost = eval( "(" + jsonPost + ")" );//转换后的JSON对象

            if (author.toString() != jsPost.author.toString()) {
                req.flash('fail', '权限不足');
            }
            else {
                console.log("ready render edit.ejs");
                res.render('edit', {
                    post: jsPost
                });
            }
        }
    }, function (error) {
        // 异常处理
        req.flash('fail', '获取文章失败');
    });

    // PostModel.getRawPostById(postId)
    //     .then(function (post) {
    //         if (!post) {
    //             throw new Error('该文章不存在');
    //         }
    //         if (author.toString() !== post.author._id.toString()) {
    //             throw new Error('权限不足');
    //         }
    //         res.render('edit', {
    //             post: post
    //         });
    //     })
    //     .catch(next);
});

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function(req, res, next) {
    var postId = req.params.postId;
    var title = req.fields.title;
    var content = req.fields.content;

    var post = AV.Object.createWithoutData('Post', postId);
    post.set('title',title);
    post.set('content',content);
    post.save().then(function (post) {
        console.log('objectId is ' + post.id);
        req.flash('success', '编辑文章成功');
        // 编辑成功后跳转到上一页
        res.redirect(`/posts/${postId}`);
    }, function (error) {
        req.flash('success', '编辑文章失败');
        console.error(error);
    });

    // query.get(postId).then(function (post) {
    //     if (post == null){
    //         req.flash('fail', '获取文章失败');
    //     }
    //     else {
    //         var user = req.session.user;
    //         var jsonPost = JSON.stringify(post);
    //         console.log(jsonPost);
    //         var jsPost = eval( "(" + jsonPost + ")" );//转换后的JSON对象
    //         if (author.toString() != post.author.toString()) {
    //             req.flash('fail', '权限不足');
    //         }
    //         else {
    //             res.render('edit', {
    //                 author: user,
    //                 post: jsPost
    //             });
    //         }
    //     }
    // }, function (error) {
    //     // 异常处理
    //     req.flash('fail', '获取文章失败');
    // });
    //
    // PostModel.updatePostById(postId, author, { title: title, content: content })
    //     .then(function () {
    //         req.flash('success', '编辑文章成功');
    //         // 编辑成功后跳转到上一页
    //         res.redirect(`/posts/${postId}`);
    //     })
    //     .catch(next);
});

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function(req, res, next) {
    var postId = req.params.postId;

    var post = AV.Object.createWithoutData('Post', postId);
    post.destroy().then(function (success) {
        // 删除成功
        req.flash('success', '删除文章成功');
        // 删除成功后跳转到主页
        res.redirect('/posts');
    }, function (error) {
        // 删除失败
        req.flash('success', '删除文章失败');
    });

    // PostModel.delPostById(postId, author)
    //     .then(function () {
    //         req.flash('success', '删除文章成功');
    //         // 删除成功后跳转到主页
    //         res.redirect('/posts');
    //     })
    //     .catch(next);
});

// POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment', checkLogin, function(req, res, next) {
    res.send(req.flash());
});

// GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/:postId/comment/:commentId/remove', checkLogin, function(req, res, next) {
    res.send(req.flash());
});

module.exports = router;