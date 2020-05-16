// const express = require('express')
// const router = express.Router()
const Router = require('koa-router');
const router = new Router();

const bcrypt = require('bcrypt')
const gravatar = require('gravatar')
const jwt = require('jsonwebtoken')
// const passport = require('passport')
const passport = require('koa-passport');
const { secretOrKey } = require('../../config/keys')

//引入User
const User = require('../../models/User')

//引入input验证
const validateRegisterInput = require('../../validation/register')
const validateLoginInput = require('../../validation/login')

//test url地址: /api/users/test
router.get('/test', async ctx => {
  ctx.status = 200;
  ctx.body = { msg: 'users works...' }
})

//注册 url地址: /api/users/register
router.post('/register', async ctx => {
  // console.log(ctx.request.body)
  const { errors, isValid } = validateRegisterInput(ctx.request.body)
  //判断是否验证通过
  if(!isValid) {
    ctx.status = 400;
    ctx.body = errors;
    return;
  }

  //查找数据库
  const findResult = await User.find({ email: ctx.request.body.email });
  if (findResult.length > 0) {
    ctx.status = 500;
    ctx.body = { message: '邮箱已被占用' }
  } else {
    const avatar = gravatar.url(ctx.request.body.email, { s: '200', r: 'pg', d: 'mm' });
    const newUser = new User({
      username: ctx.request.body.username,
      email: ctx.request.body.email,
      password: ctx.request.body.password,
      identity: ctx.request.body.identity,
      avatar
    })
    //对密码hash加密
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(newUser.password, salt);
    newUser.password = hash;
    //存储到数据库
    const user = await newUser.save();
    ctx.body = user;
  }
})

//登录 url地址: /api/users/login
router.post('/login', async ctx => {
  const { errors, isValid } = validateLoginInput(ctx.request.body)
  //判断是否验证通过
  if(!isValid) {
    ctx.status = 400;
    ctx.body = errors;
    return;
  }

  //查找数据库
  const user = await User.findOne({ email: ctx.request.body.email });
  const password = ctx.request.body.password;
  if (!user) {
    ctx.status = 500;
    ctx.body = { message: '用户不存在' }
  } else {
    const result = bcrypt.compareSync(password, user.password)
    //验证密码通过
    if (result) {
      //返回token
      // console.log(user)
      const payload = {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        identity: user.identity
      }
      const token = await jwt.sign(payload, secretOrKey, { expiresIn: 3600 });
      ctx.status = 200;
      ctx.body = { code: true, message: "登录成功", token: "Bearer " + token }
    } else {
      ctx.status = 400;
      ctx.body = { code: false, message: "密码错误!" }
    }
  }
})

router.get("/current", passport.authenticate("jwt", { session: false }), async ctx => {
  ctx.body = {
    id: ctx.state.user.id,
    username: ctx.state.user.username,
    email: ctx.state.user.email,
    identity: ctx.state.user.identity,
    avatar: ctx.state.user.avatar
  }
})

//请求地址 : /api/users/register
// router.post("/register", (req, res) => {
//   User.findOne({ email: req.body.email }).then(user => {
//     if (user) {
//       return res.status(400).json({ message: "邮箱已被注册" })
//     } else {
//       const avatar = gravatar.url(req.body.email, { s: '200', r: 'pg', d: 'mm' });
//       const newUser = new User({
//         username: req.body.username,
//         email: req.body.email,
//         password: req.body.password,
//         avatar,
//         identity: req.body.identity
//       })
//       const saltRounds = 10;
// bcrypt.genSalt(saltRounds, (err, salt) => {
//   bcrypt.hash(newUser.password, salt, (err, hash) => {
//     if (err) throw err;
//     newUser.password = hash;
//     newUser.save()
//       .then(user => res.json(user))
//       .catch(err => console.log(err))
//   });
// });
//     }
//   })
// })

// router.post("/login", (req, res) => {
//   const email = req.body.email;
//   const password = req.body.password;
//   User.findOne({ email }).then(user => {
//     if (!user) {
//       return res.status(400).json({ message: "用户不存在" })
//     }
//     //密码匹配
//     bcrypt.compare(password, user.password)
//       .then(isMatch => {
//         if (isMatch) {
//           const rule = {
//             id: user.id,
//             username: user.username,
//             avatar: user.avatar,
//             identity: user.identity
//           }
//           // jwt.sign("规则","加密名字","过期时间","箭头函数")
//           jwt.sign(rule, secretOrKey, { expiresIn: 3600 }, (err, token) => {
//             res.json({
//               code: true,
//               message: "登录成功",
//               token: "Bearer " + token
//             })
//           })
//         } else {
//           return res.status(400).json({ message: "密码错误!" })
//         }
//       })
//   })
// })

// router.get("/current", passport.authenticate("jwt", { session: false }), (req, res) => {
//   res.json({
//     id: req.user.id,
//     username: req.user.username,
//     email: req.user.email,
//     identity: req.user.identity
//   });
// })

module.exports = router.routes();