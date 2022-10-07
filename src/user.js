const axios = require("axios");
const jwt = require('jsonwebtoken');
const srcret = "towser2022";
const mysqlUrl = "http://localhost:7707"

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
    resp.result = {
      account,
      token,
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

async function updateUserInfo(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const cookie = req.cookies["user"];
    const { account } = jwt.verify(cookie, srcret);
    const { bank } = req.body;
    // bank需要做严格校验，不要相信用户!
    const sql =
      `
      UPDATE
        user
      SET
        bank="${bank}"
      WHERE
        account="${account}"
      `
    await axios.post(mysqlUrl, { sql });
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

async function getWellInfo(req, res) {
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
        account,
        money,
        bank
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result = await axios.post(mysqlUrl, { sql });
    const { money, bank } = result.data.result[0];
    resp.result = {
      account,
      money,
      bank
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

async function getWellRecords(req, res) {
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
        cash,
        apply_time as applyTime,
        status,
        well.desc
      FROM
        well
      WHERE
        user = "${account}"
      ORDER BY
        apply_time
      desc
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result
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

async function well(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const cookie = req.cookies["user"];
    const { account } = jwt.verify(cookie, srcret);
    let sql =
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
    const { cash } = req.body;
    const newMoney = (money - cash).toFixed(2);
    if (newMoney < 0) {
      resp.code = 3;
      resp.result = `提现金额超出提现金额`
      res.send(resp);
      return;
    }

    const date = new Date();
    sql =
      `
      UPDATE
        user
      SET
        money="${newMoney}"
      WHERE
        account="${account}"
      `
    await axios.post(mysqlUrl, { sql });

    const now = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
    sql =
      `
      INSERT INTO
        well
        (user, cash, apply_time, status)
      VALUE
        ("${account}", ${cash}, "${now}", 1)
      `
    await axios.post(mysqlUrl, { sql });
    resp.result = {
      money: newMoney
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

async function getUserInfo(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const cookie = req.cookies["user"];
    const { account } = jwt.verify(cookie, srcret);
    await calcPower(account);
    const sql =
      `
      SELECT
        money,
        power,
        max_power as maxPower,
        speed,
        UNIX_TIMESTAMP(next_power_time) as nextPowerTime
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result[0];
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

async function getUserInfo2(req, res) {
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
        account,
        money,
        bank
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result = await axios.post(mysqlUrl, { sql });
    const { money, bank } = result.data.result[0];
    resp.result = {
      account,
      money,
      bank
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

function calcPower(account) {
  return new Promise(async succ => {
    let sql =
      `
      SELECT
        power,
        max_power as maxPower,
        speed,
        UNIX_TIMESTAMP(next_power_time) as nextPowerTime
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result = await axios.post(mysqlUrl, { sql });
    let { power, maxPower, speed, nextPowerTime } = result.data.result[0];
    const now = Math.floor(Date.now() / 1000);


    // 当前体力满了
    if (power >= maxPower) {
      sql =
        `
        UPDATE
          user
        SET
          power = ${maxPower},
          next_power_time = NULL
        WHERE
          account = "${account}"
        `
      await axios.post(mysqlUrl, { sql });
      succ(true);
      return;
    }

    // 没到时间，不用修改
    const total = now - nextPowerTime;
    if (total < 0) {
      succ(true);
      return;
    }

    // 10分钟
    const space = 1 * 60 * 10;
    const count = Math.floor(total / space) + 1;
    power = Math.min(maxPower, power + count * speed);
    nextPowerTime += count * space;
    const n = new Date(nextPowerTime * 1000);
    const newPowerTime = `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()} ${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}`;

    sql =
      `
    UPDATE
      user
    SET
      power = ${power},
      next_power_time = ${power < maxPower ? `"${newPowerTime}"` : "NULL"}
    WHERE
      account = "${account}"
      `
    await axios.post(mysqlUrl, { sql });
    succ(true);
  })
}

module.exports = {
  login,
  getUserInfo,
  checkUserLogin,
  getUserInfo2,
  updateUserInfo,
  calcPower,
  getWellInfo,
  well,
  getWellRecords
}