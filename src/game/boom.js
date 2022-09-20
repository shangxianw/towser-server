const axios = require("axios");
const md5 = require("../md5");

// 15
class Boom {
  mysqlUrl = "http://localhost:9190";
  // 02
  async startGame(req, res, activity, spec) {
    const resp = {
      code: 1,
      msg: "",
      result: null
    }
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
    let result = await axios.post(this.mysqlUrl, { sql });
    if (result.data.code !== 1) {
      resp.code = 140101;
      resp.msg = "查询活动用户状态错误"
      res.send(resp);
      return;
    };
    let isNone = result.data.result.length === 0;
    if (isNone) {
      resp.code = 140102;
      resp.msg = "查询不到规格"
      res.send(resp);
      return;
    }
    const data = result.data.result[0];
    const { row, col, boom } = data;
    if (boom > row * col) {
      resp.code = 140103;
      resp.msg = "炸弹数量比棋盘格子的多"
      res.send(resp);
      return;
    }

    // 真实的棋盘
    const chessBoards = this.createChessBoard(row, col, boom);
    // 给前端展示的棋盘
    const fakeChessBoards = this.getFakeChessBoard(chessBoards);

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
      token: md5.encode(JSON.stringify(token))
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
    axios.post(this.mysqlUrl, { sql });
  }

  // 03
  async openBoomCell(req, res) {
    const resp = {
      code: 1,
      msg: "",
      result: null
    }
    const { row, col, token } = req.body;
    const data = md5.decode(token);

    if (data.status === 2) {
      resp.code = 150301;
      resp.msg = "已结束，不能再继续啦";
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
        const fakeChessBoards = this.getFakeChessBoard(data.chessBoards);
        resp.result = {
          status: 1,
          chessBoards: fakeChessBoards,
          token
        };
        res.send(resp);
        return;
      }
      const newChessBoadrs = this.calc(row, col, JSON.parse(JSON.stringify(data.chessBoards)));
      const fakeChessBoards = this.getFakeChessBoard(newChessBoadrs);
      data.chessBoards = newChessBoadrs;
      const isOver = this.checkIsOver(newChessBoadrs);

      if (isOver) {
        // 不校验了
        const cookie = req.cookies["user"];
        const { account } = md5.decode(cookie);
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
        const result = await axios.post(this.mysqlUrl, { sql });
        if (result.data.code !== 1) {
          resp.code = 150302;
          resp.msg = "查询基本信息错误"
          res.send(resp);
          return;
        };

        // 通关玩家+1（前端显示用，不计较成败，不能作为实际结算）
        sql =
          `
        UPDATE activity
          SET win_count = win_count + 1
        WHERE
          id = ${data.activity};
        `
        axios.post(this.mysqlUrl, { sql });
      }

      data.status = isOver ? 3 : 1;
      resp.result = {
        status: isOver ? 3 : 1,
        chessBoards: isOver ? data.chessBoards : fakeChessBoards,
        token: md5.encode(JSON.stringify(data))
      }
    }
    // 点击了炸弹
    else {
      data.status = 2;
      resp.result = {
        status: 2,
        chessBoards: data.chessBoards,
        token: md5.encode(JSON.stringify(data))
      }
    }
    res.send(resp)
  }

  calc(row, col, chessBoards) {
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
        this.calc(y, x, chessBoards);
      })
    }
    return chessBoards;
  }

  createChessBoard(row, col, boom) {
    const total = row * col;
    if (boom > total) return [];
    const chessBoards = [];
    for (let i = 0; i < total; i++) {
      chessBoards.push({
        index: i,
        row: Math.floor(i / row),
        col: Math.floor(i % col),
        isBoom: false,
        calc: null
      })
    }
    let count = 0;
    let i = 0;
    while (count <= boom) {
      i++;
      if (i >= chessBoards.length) {
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

  getFakeChessBoard(chessBoards) {
    const copys = JSON.parse(JSON.stringify(chessBoards));
    for (let rows of copys) {
      for (let item of rows) {
        item.isBoom = false;
      }
    }
    return copys;
  }

  checkIsOver(chessBoards) {
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
}




Boom._instance = null;
Boom.Ins = () => {
  if (!Boom._instance) {
    Boom._instance = new Boom();
  }
  return Boom._instance;
}
module.exports = Boom;