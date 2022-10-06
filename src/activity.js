const axios = require("axios");
const mysqlUrl = "http://localhost:7707"

const targetKind = {
  1: "end",
  2: "win_count",
  3: "play_count"
}

const targetSort = {
  1: "DESC",
  2: "ASC"
}

async function getActivityList(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { kind, sort } = req.query;
    const sql =
      `
      SELECT
        activity.id,
        activity.sponsor as sponsor,
        game_type.name as gameName,
        sponsor.name as sponsorName,
        activity.money,
        activity.win_count as winCount,
        activity.play_count as playCount,
        activity.start,
        activity.end
      FROM
        activity
      RIGHT JOIN
        game_type
      ON
        activity.game = game_type.id
      INNER JOIN
        sponsor
      ON
        sponsor.id = activity.sponsor
      ORDER BY
        ${targetKind[Number(kind)] || "end"}
      ${targetSort[Number(sort)] || "ASC"}
      `;
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result;
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

async function getWinPlayer(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const id = req.query.activity;
    let sql =
      `
      SELECT
        pass.user as account,
        pass.win_time as winTime
      FROM
        pass
      INNER JOIN
        activity
      ON
        activity.id = pass.activity
      WHERE
        pass.activity = ${id}
      AND
        UNIX_TIMESTAMP(pass.win_time ) < UNIX_TIMESTAMP(activity.end)

      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result;
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

// 结算
async function calcActivity(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { id } = req.body;
    // 查询结果
    let sql =
      `
      SELECT
        activity.money,
        pass.user
      FROM
        activity
      INNER JOIN
        pass
      ON
        activity.id = pass.activity
      WHERE
        UNIX_TIMESTAMP(pass.win_time) < UNIX_TIMESTAMP(activity.end)
      AND
        activity.id = ${id}
      `
    const result = (await axios.post(mysqlUrl, { sql })).data.result;
    // 没有人通关
    if (result.length === 0) {
      // 切换活动结算状态
      sql =
        `
      UPDATE
        activity
      SET
        is_calc = 1
      WHERE
        id = ${id}
      `
      await axios.post(mysqlUrl, { sql })
      res.send(resp);
      return;
    }
    const { money } = result[0];
    const guafen = Number(Number(money) / result.length).toFixed(2);

    // 瓜分余额
    const obj = {};
    result.forEach(({ user }) => {
      if (obj[user] == null) obj[user] = 0;
      obj[user] += Number(guafen);
    })
    let whenSQL = ""
    let whereSQL = []
    for (let user in obj) {
      whenSQL += `WHEN "${user}" THEN money + ${obj[user]}\n`;
      whereSQL.push(`"${user}"`)
    }
    whereSQL = whereSQL.join();
    sql =
      `
    UPDATE user
      SET money = CASE account 
        ${whenSQL}
      END
    WHERE account IN (${whereSQL})
    `
    await axios.post(mysqlUrl, { sql });

    // 切换活动结算状态
    sql =
      `
    UPDATE
      activity
    SET
      is_calc = 1
    WHERE
      id = ${id}
    `
    await axios.post(mysqlUrl, { sql })
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

async function getActivetyDetail(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const id = req.query.activity;
    let sql =
      `
      SELECT
        game
      FROM
        activity
      WHERE
        id = ${id}
      `
    const result1 = await axios.post(mysqlUrl, { sql });
    let gameType = null;
    gameType = Number(result1.data.result[0].game);
    // 扫雷
    if (gameType === 1) {
      sql =
        `
        SELECT
          activity.id,
          game_type.name as gameName,
          sponsor.name as sponsorName,
          sponsor.desc,
          activity.game,
          boom_spec.row,
          boom_spec.col,
          boom_spec.boom,
          activity.money,
          activity.play_count as playCount,
          activity.win_count as winCount,
          activity.end
        FROM
          activity
        RIGHT JOIN
          game_type
        ON
          activity.game = game_type.id
        INNER JOIN
          sponsor
        ON
          sponsor.id = activity.sponsor
        INNER JOIN
          boom_spec
        ON
          activity.spec = boom_spec.id
        WHERE
          activity.id = ${id}
        `
    } else {
      resp.code = 3;
      resp.msg = "不存在此游戏类型";
      res.send(resp);
      return;
    }

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

module.exports = {
  getActivityList,
  getActivetyDetail,
  getWinPlayer,
  calcActivity
}