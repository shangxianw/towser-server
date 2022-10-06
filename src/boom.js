const axios = require("axios");
const jwt = require('jsonwebtoken');

const mysqlUrl = "http://localhost:7707"
const srcret = "towser2022";

function checkIsOver(chessBoards) {
  let flag = true;
  for (let rows of chessBoards) {
    for (let item of rows) {
      if (!item.isBoom && item.calc === null) {
        flag = false;
        break;
      }
    }
  }
  return flag;
}

function calc(row, col, chessBoards) {
  const rows = chessBoards[row];
  if (!rows) return [];
  const cell = rows[col];
  if (!cell) return [];
  if (typeof cell.calc === "number") return [];
  if (cell.isBoom) return [];

  // 记录8个方向的偏移量
  const offsetMatrix = [
    [-1, -1], [-1, 0], [-1, +1],
    [0, -1], [0, +1],
    [+1, -1], [+1, 0], [+1, +1],
  ]

  let sum = 0;
  offsetMatrix.forEach((item, index) => {
    const x = col + item[1];
    const y = row + item[0];

    const rows = chessBoards[y]
    if (!rows) return;
    const cell = rows[x];
    if (!cell) return;

    if (!cell.isBoom) return;
    sum++;
  })

  cell.calc = sum;
  if (sum === 0) {
    offsetMatrix.forEach(item => {
      const x = col + item[1];
      const y = row + item[0];
      calc(y, x, chessBoards);
    })
  }
  return chessBoards;
}

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

async function openBoomCell(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { row, col, token } = req.body;
    const data = jwt.verify(token, srcret);

    if (data.status === 2) {
      resp.code = 150301;
      resp.msg = "已结束，不能继续";
      resp.result = {
        status: 2,
        chessBoards: data.chessBoards,
        token
      }
      res.send(resp);
      return;
    }

    // 计算完之后，赋值新的棋盘，需要注意row, col超出数组界限
    const cell = data.chessBoards[row][col];
    if (!cell.isBoom) {
      // 计算过的地方不让点！前端也要做好检测
      if (typeof cell.calc === "number") {
        const fakeChessBoards = getFakeChessBoard(data.chessBoards);
        resp.result = {
          status: 1,
          chessBoards: fakeChessBoards,
          token
        };
        res.send(resp);
        return;
      }
      const newChessBoadrs = calc(row, col, JSON.parse(JSON.stringify(data.chessBoards)));
      const fakeChessBoards = getFakeChessBoard(newChessBoadrs);
      data.chessBoards = newChessBoadrs;
      const isOver = checkIsOver(newChessBoadrs);

      if (isOver) {
        // 不校验了
        const cookie = req.cookies["user"];
        const { account } = jwt.verify(cookie, srcret);
        const date = new Date();
        const win_time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
        let sql =
          `
          INSERT INTO
            pass
            (activity, user, start_time, win_time)
          VALUE
            (${data.activity}, "${account}", "${win_time}", "${win_time}")
          `
        const result = await axios.post(mysqlUrl, { sql });
        // 通关玩家+1（前端显示用，不计较成败，不能作为实际结算）
        sql =
          `
        UPDATE activity
          SET win_count = win_count + 1
        WHERE
          id = ${data.activity};
        `
        axios.post(mysqlUrl, { sql });
      }

      data.status = isOver ? 3 : 1;
      resp.result = {
        status: isOver ? 3 : 1,
        chessBoards: isOver ? data.chessBoards : fakeChessBoards,
        token: jwt.sign(JSON.stringify(data), srcret)
      }
    }
    // 点击了炸弹
    else {
      data.status = 2;
      resp.result = {
        status: 2,
        chessBoards: data.chessBoards,
        token: jwt.sign(JSON.stringify(data), srcret)
      }
    }
    res.send(resp)
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
  openBoomCell
}