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
  getActivetyDetail
}