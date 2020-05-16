// const express = require('express')
const koa = require('koa');
const Router = require('koa-router');

// const app = express()
//实例化koa
const app = new koa();
const router = new Router();


const mongoose = require('mongoose')
// const bodyParser = require('body-parser')
const bodyParser = require('koa-bodyparser');
// const passport = require('passport')
const passport = require('koa-passport');
const { db } = require('./config/keys')
const port = process.env.PORT || 5000

//引入模块
const users = require("./routes/api/users")
// const profiles = require("./routes/api/profiles")

//使用静态资源中间件
// app.use(express.static('public'))

//使用body-parser中间件
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json())
app.use(bodyParser());

//passport初始化
app.use(passport.initialize())
app.use(passport.session());
//回调到config的passport.js文件
require('./config/passport')(passport)

// 配置路由地址 注意:!express用app.use
router.use("/api/users", users);
// router.use("/api/profiles", profiles)

//配置路由
app.use(router.routes()).use(router.allowedMethods());

//注意:!express用app.get
router.get("/", async ctx => {
  ctx.body = { msg: "Hello Koa" }
})

// 通过mongoose连接数据库
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('连接数据库成功!!!')
    // 只有当连接上数据库后才去启动服务器
    app.listen(port, () => {
      console.log(`服务器启动成功, 请访问: http://localhost:${port}`)
    })
  })
  .catch(error => {
    console.error('连接数据库失败', error)
  })





