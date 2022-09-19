var mysql = require('mysql');
const express = require("express");
const bodyParser = require("body-parser");

class MySQL {
  server = null;
  port = 9190;
  connection = {}
  constructor() {
    this.server = express();
    this.initHeader();
    this.initBodyParser();
    this.initRoute();
    this.server.listen(this.port, () => {
      console.log("server run in port", this.port)
      this.connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'towser'
      });
      this.connection.connect((a, b, c) => {
        console.log(`数据库towser已启动`)
      });
    })
  }

  // 没有这个的话,req.body为undefined
  initBodyParser() {
    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: false }));
  }

  initHeader() {
    this.server.all("*", async (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*"); // http://localhost:8080
      res.header("Access-Control-Allow-Methods", "GET, POST");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      next();
    })
  }

  initRoute() {
    this.server.post("/", async (req, res) => {
      const { sql } = req.body;
      const resp = await this.query(sql);
      res.send(resp);
    })
  }

  query(sql) {
    return new Promise(succ => {
      const resp = {
        code: 1,
        msg: "",
        result: null
      }
      this.connection.query(sql, (error, result) => {
        if (error) {
          resp.code = 2;
          resp.msg = "查询错误";
          resp.result = error;
          succ(resp)
          return;
        }

        resp.result = result;
        succ(resp);
      })
    })
  }
}

new MySQL;