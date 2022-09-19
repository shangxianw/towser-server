const axios = require("axios");
const md5 = require("./md5");

class Activity {
  mysqlUrl = "http://localhost:9190"

  async getActivityList(req, res) {
    const resp = {
      code: 1,
      msg: "",
      result: null
    }
    const sql =
      `
      SELECT
        activity.id,
        game_type.name as gameName,
        sponsor.name as sponsorName
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
      `;
    const result = await axios.post(this.mysqlUrl, { sql })
    if (result.data.code === 1) {
      resp.result = result.data.result;
    } else {
      resp.code = 2;
      resp.msg = "查询错误"
    }
    res.send(resp);
  }

  async getActivetyDetail(req, res) {
    const id = req.query.id
    const resp = {
      code: 1,
      msg: "",
      result: null
    }

    let sql =
      `
      SELECT
        game
      FROM
        activity
      WHERE
        id = ${id}
      `
    const result1 = await axios.post(this.mysqlUrl, { sql });
    let gameType = null;
    if (result1.data.code === 1) {
      if (result1.data.result.length === 0) {
        resp.code = 2;
        resp.msg = "游戏类型不存在";
        res.send(resp);
        return;
      }
      gameType = Number(result1.data.result[0].game);
    } else {
      resp.code = 2;
      resp.msg = "查询错误"
      res.send(resp);
      return;
    }

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
          boom_spec.boom
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

    const result = await axios.post(this.mysqlUrl, { sql });
    if (result.data.code === 1) {
      if (result.data.result.length === 0) {
        resp.code = 3;
        resp.msg = "活动不存在";
      } else {
        resp.result = result.data.result[0];
      }
    } else {
      resp.code = 2;
      resp.msg = "查询错误"
    }
    res.send(resp);
  }
}

Activity._instance = null;
Activity.Ins = () => {
  if (!Activity._instance) {
    Activity._instance = new Activity();
  }
  return Activity._instance;
}

module.exports = Activity;