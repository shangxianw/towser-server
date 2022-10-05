const axios = require("axios");

const mysqlUrl = "http://localhost:7707";

async function checkCanStart(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }
  
  async function query() {
    const activity = Number(req.query.activity);
    const sql = 
    `
    select
      id
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
    resp.result = result.data.result.length > 0;
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
    let sql =
      `
      SELECT
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
    const gameType = result.data.result[0].game;

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