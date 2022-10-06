const axios = require("axios");
const jwt = require('jsonwebtoken');
const srcret = "towser2022";
const mysqlUrl = "http://localhost:7707";

async function checkCanStart(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const activity = Number(req.query.activity);
    let sql =
      `
    select
      id,
      power
    FROM
      activity
    WHERE
      id = ${activity}
    AND
      UNIX_TIMESTAMP(NOW()) >= UNIX_TIMESTAMP(start)
    AND
      UNIX_TIMESTAMP(NOW()) < UNIX_TIMESTAMP(end)
    `
    const result = await axios.post(mysqlUrl, { sql });
    if (result.data.result.length <= 0) {
      resp.result = false;
      res.send(resp);
      return;
    }

    const power = result.data.result[0].power;
    const cookie = req.cookies["user"];
    const { account } = jwt.verify(cookie, srcret);
    sql =
      `
      SELECT
        power
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result2 = await axios.post(mysqlUrl, { sql });
    const myPower = result2.data.result[0].power;
    if (myPower < power) {
      resp.code = 4;
      resp.msg = "体力不足";
      res.send(resp);
      return;
    }

    resp.result = true;
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

async function startGame(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const activity = Number(req.query.activity);
    // 获取活动配置
    let sql =
      `
      SELECT
        power,
        game,
        spec,
        end
      FROM
        activity
      WHERE
        id = ${activity}
      AND
        UNIX_TIMESTAMP(NOW()) >= UNIX_TIMESTAMP(start)
      AND
        UNIX_TIMESTAMP(NOW()) < UNIX_TIMESTAMP(end)
      `
    const result = await axios.post(mysqlUrl, { sql });
    const power = result.data.result[0].power;
    const gameType = result.data.result[0].game;

    const cookie = req.cookies["user"];
    const { account } = jwt.verify(cookie, srcret);
    // 获取用户体力
    sql =
      `
      SELECT
        power,
        UNIX_TIMESTAMP(next_power_time) as nextPowerTime
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result2 = await axios.post(mysqlUrl, { sql });
    const myPower = result2.data.result[0].power;
    if (myPower < power) {
      resp.code = 4;
      resp.msg = "体力不足";
      res.send(resp);
      return;
    }

    // 计算消耗体力之后的恢复时间
    const nextPowerTime = result2?.data?.result[0]?.nextPowerTime || (Math.floor((Date.now()/1000)) + 1 * 60 * 10);
    const n = new Date((nextPowerTime) * 1000);
    const a = `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()} ${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}`;
    sql =
      `
      UPDATE
        user
      SET
        power = power - ${power},
        next_power_time = "${a}"
      WHERE
        account = "${account}"
      `
    await axios.post(mysqlUrl, { sql });

    // 扫雷
    if (gameType === 1) {
      const boom = require("./boom");
      const spec = result.data.result[0].spec;
      boom.startGame(req, res, activity, spec);
    } else {
      resp.code = 3
      resp.msg = "不存在该游戏类型";
      res.send(resp);
      return;
    }
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
  startGame,
  checkCanStart
}