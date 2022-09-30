const axios = require("axios");
const jwt = require('jsonwebtoken');
const mysqlUrl = "http://localhost:7707"

const srcret = "towser2022";

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

    // 3天没登录就过期
    expTime = 1000 * 60 * 60 * 24 * 3;
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
    const { account } = md5.decode(cookie);
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
  getUserInfo
}