const axios = require("axios");
const jwt = require('jsonwebtoken');

const mysqlUrl = "http://localhost:7707"
const srcret = "towser2022";

function createChessBoard(row, col, boom) {
  const total = row * col;
  if (boom > total) return [];
  const chessBoards = [];
  for (let i = 0; i < total; i++) {
    chessBoards.push({
      index: i,
      row: Math.floor(i / col),
      col: Math.floor(i % col),
      isBoom: false,
      calc: null
    })
  }
  let count = 0;
  const len = chessBoards.length;
  let i = Math.floor(Math.random() * len);
  while (count <= boom) {
    i++;
    if (i >= len) {
      i = 0;
    }
    const flag = Math.random() > 0.8;
    if (!flag) continue;

    chessBoards[i].isBoom = true;
    count++;
  }

  for (let i = 0; i < row; i++) {
    const arr = chessBoards.splice(0, col);
    chessBoards.push(arr);
  }
  return chessBoards;
}

function getFakeChessBoard(chessBoards) {
  const copys = JSON.parse(JSON.stringify(chessBoards));
  for (let rows of copys) {
    for (let item of rows) {
      item.isBoom = false;
    }
  }
  return copys;
}

async function startGame(req, res, activity, spec) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    let sql =
      `
      SELECT
        boom_spec.row,
        col,
        boom
      FROM
        boom_spec
      WHERE
        id = ${spec}
      `
    let result = await axios.post(mysqlUrl, { sql });
    const { row, col, boom } = result.data.result[0];
    // 真实的棋盘
    const chessBoards = createChessBoard(row, col, boom);
    // 给前端展示的棋盘
    const fakeChessBoards = getFakeChessBoard(chessBoards);

    // 点击单元格时传递的是这个
    const token = {
      activity,
      gameType: 1,
      spec,
      row,
      col,
      boom,
      status: 0,
      chessBoards
    }

    // status 0初始化 1正在进行中（点击第一个cell就开始计算） 2因为点了炸弹而结束 3正常完成对局 
    const tmp = {
      status: 0,
      activity,
      gameType: 1,
      spec,
      row,
      col,
      boom,
      chessBoards: fakeChessBoards,
      token: jwt.sign(JSON.stringify(token), srcret)
    }

    resp.result = tmp;
    res.send(resp);

    // 玩家+1
    sql =
      `
      UPDATE activity
      SET play_count = play_count + 1
      WHERE
        id = ${activity};
      `
    axios.post(mysqlUrl, { sql });
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
  startGame
}