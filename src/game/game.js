const Boom = require("./boom");
const axios = require("axios");
const md5 = require("../md5");

// 14
class Game {
  mysqlUrl = "http://localhost:9190"
  // 01
  async startGame(req, res) {
    const activity = Number(req.query.activity);
    const cookie = req.cookies["user"] || "";
    const { account } = md5.decode(cookie);
    const resp = {
      code: 1,
      msg: "",
      result: null
    }

    let sql =
      `
      SELECT
        game,
        spec
      FROM
        activity
      WHERE
        id = ${activity}
      `
    const result = await axios.post(this.mysqlUrl, { sql });
    if (result.data.code !== 1) {
      resp.code = 140103;
      resp.msg = "查询活动游戏规格错误"
      res.send(resp);
      return;
    };
    const isNone = result.data.result.length === 0
    if (isNone) {
      resp.code = 140104
      resp.msg = "活动未配置";
      res.send(resp);
      return;
    }
    // 确定游戏类型和规格
    const gameType = result.data.result[0].game;
    const spec = result.data.result[0].spec;

    // 扫雷
    if (gameType === 1) {
      Boom.Ins().startGame(req, res, activity, spec);
    } else {
      resp.code = 140105
      resp.msg = "不存在该游戏类型";
      res.send(resp);
      return;
    }
  }
}




Game._instance = null;
Game.Ins = () => {
  if (!Game._instance) {
    Game._instance = new Game();
  }
  return Game._instance;
}
module.exports = Game;