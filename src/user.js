const axios = require("axios");
const jwt = require('jsonwebtoken');
const mysqlUrl = "http://localhost:7707"

const srcret = "towser2022";

async function checkUserLogin(req, res, next) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  const token = req.cookies["user"];
  if (!token) {
    resp.code = 1001;
    resp.msg = "用户信息不存在";
    res.send(resp);
    return;
  }

  const { account, password, exp } = jwt.verify(token, srcret);
  const sql = `select password from user where account='${account}'`;
  const result = await axios.post(mysqlUrl, { sql })
  const userInfo = result.data.result[0];
  if (!userInfo) {
    resp.code = 1002;
    resp.msg = "账号不存在";
    res.send(resp);
    return;
  }

  if (userInfo.password !== password) {
    resp.code = 1003;
    resp.msg = "密码不正确";
    res.send(resp);
    return;
  }

  const now = (new Date()).getTime();
  if (now > exp) {
    resp.code = 1004;
    resp.msg = "登录过期";
    res.send(resp);
    return;
  }

  next();
}

async function login(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { account, password } = req.body;

    const sql = `select password from user where account='${account}'`;
    const result = await axios.post(mysqlUrl, { sql })
    const userInfo = result.data.result[0];
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

    // 1小时没登录就过期
    expTime = 1000 * 60 * 60 * 1;
    const data = {
      account,
      password,
      exp: (new Date).getTime() + expTime
    }
    const token = jwt.sign(JSON.stringify(data), srcret);
    resp.result = token;
    res.send(resp);
  }

  try {
    await query();
  } catch ({ message, stack }) {
    resp.code = 2;
    resp.msg = "查询发生异常";
    resp.result = { message, stack };
    res.send(resp);
  }
}

async function getUserInfo(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const cookie = req.cookies["user"];
    const { account } = jwt.verify(cookie, srcret);
    const sql =
      `
      SELECT
        money
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result = await axios.post(mysqlUrl, { sql });
    const { money } = result.data.result[0];
    resp.result = {
      money
    }
    res.send(resp);
  }

  try {
    await query();
  } catch ({ message, stack }) {
    resp.code = 2;
    resp.msg = "查询发生异常";
    resp.result = { message, stack };
    res.send(resp);
  }
}

module.exports = {
  login,
  getUserInfo,
  checkUserLogin
}