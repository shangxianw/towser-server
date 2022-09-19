const jwt = require('jsonwebtoken');
const md5 = require("./md5");
const axios = require("axios");
const Log = require("./log");

// 11
class User {
  app = null;
  mysqlUrl = "http://localhost:9190"
  // 三天没登录就退出
  expTime = 1000 * 60 * 60 * 24 * 3;
  constructor(app) {
    this.app = app;
  }

  async login(req, res, next) {
    const { account, password } = req.body;
    const resp = {
      code: 1,
      msg: "登录成功",
      result: null
    }
    const userInfo = await this.getUserInfo(account)
    if (!userInfo) {
      resp.code = 2;
      resp.msg = "账号不存在";
      res.send(resp);
      return;
    }

    if (userInfo.password !== password) {
      resp.code = 3;
      resp.msg = "密码不正确";
      res.send(resp);
      return;
    }

    const data = {
      account,
      password,
      exp: (new Date).getTime() + this.expTime
    }
    const token = md5.encode(JSON.stringify(data));
    resp.result = token;
    res.send(resp);
  }

  // 校验用户登录情况
  // 02
  async checkUserLogin(req, res, next) {
    const resp = {
      code: 1,
      msg: "用户有效",
      result: null
    }

    const cookie = req.cookies["user"];
    if (!cookie) {
      resp.code = 110201;
      resp.msg = "user数据为空";
      res.send(resp);
      return;
    }

    const { account, password, exp } = md5.decode(cookie);
    const userInfo = await this.getUserInfo(account)
    if (!userInfo) {
      resp.code = 110202;
      resp.msg = "账号不存在";
      res.send(resp);
      return;
    }

    if (userInfo.password !== password) {
      resp.code = 110203;
      resp.msg = "密码不正确";
      res.send(resp);
      return;
    }

    const now = (new Date()).getTime()
    if (now > exp) {
      resp.code = 110204;
      resp.msg = "登录过期";
      res.send(resp);
      return;
    }

    const data = {
      account,
      password,
      // 刷新过期时间
      exp: (new Date).getTime() + this.expTime
    }
    const token = md5.encode(JSON.stringify(data));
    // 不要帮前端修改任何东西
    // res.cookie("user", md5);
    resp.result = token;
    next();
  }

  async getUserInfo(account) {
    const sql = `select * from user where account='${account}'`;
    const resp = await axios.post(this.mysqlUrl, { sql })
    if (resp.data.code === 1) {
      if (resp.data.result.length > 0)
        return resp.data.result[0]
      else
        return null;
    }
  }

  static _instance = null;
  static Ins() {
    if (!User._instance) {
      User._instance = new User();
    }
    return User._instance;
  }
}

module.exports = User;