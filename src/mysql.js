var mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'towser'
});
connection.connect((a, b, c) => {
  console.log(`数据库towser已启动`);
  startServer();
});


function startServer() {
  const express = require("express");
  const bodyParser = require("body-parser");
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.listen(7707, () => {
    console.log(`服务器已启动, 访问地址为 http://localhost:7707`)
  });

  app.all("*", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  })

  app.post("/", async (req, res) => {
    const { sql } = req.body;
    const resp = await this.query(sql);
    res.send(resp);
  })

  app.get("/", async (req, res) => {
    const { sql } = req.query;
    const resp = await query(sql);
    res.send(resp);
  })
}

function query(sql) {
  return new Promise(succ => {
    const resp = {
      code: 1,
      msg: "",
      result: null
    }
    connection.query(sql, (error, result) => {
      if (error) {
        resp.code = 2;
        resp.msg = "查询发生错误";
        resp.result = error;
        succ(resp)
        return;
      }

      resp.result = result;
      succ(resp);
    })
  })
}