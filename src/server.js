const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const User = require("./User");
const Activity = require("./activity");
const Game = require("./game/game.js");
const Boom = require("./game/boom");

class Server {
  server = null;
  port = 9091;
  constructor() {
    process.argv[2] && (this.port = Number(process.argv[2]));
    this.server = express();
    this.initCookie();
    this.initBodyParser();
    this.initHeader();
    this.initRoute();
    this.server.listen(this.port, () => {
      console.log("server in port", this.port)
    })
  }

  initCookie() {
    this.server.use(cookieParser())
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

      // 正常请求，需要校验用户账号密码有效性
      const flag = ["/login", "/checkActive"].every(item => req.params[0] !== item)
      if (flag) {
        User.Ins().checkUserLogin(req, res, next);
      } else {
        next();
      }
    })
  }

  initRoute() {
    this.server.get("/", (req, res) => {
      res.send("hello express")
    })

    this.server.post("/login", (req, res) => {
      User.Ins().login(req, res);
    })

    this.server.get("/test", (req, res) => {
      res.send("hello express test")
    })

    this.server.get("/checkActive", (req, res) => {
      res.send("hello express")
    })

    // 请求活动列表
    this.server.get("/getActivityList", (req, res) => {
      Activity.Ins().getActivityList(req, res);
    })

    // 请求活动详情
    this.server.get("/getActivetyDetail", (req, res) => {
      Activity.Ins().getActivetyDetail(req, res);
    })

    // 创建游戏
    this.server.get("/startGame", (req, res) => {
      Game.Ins().startGame(req, res);
    })

    //////////////////////////////////// 扫雷
    // 点击单元格
    this.server.post("/openBoomCell", (req, res) => {
      Boom.Ins().openBoomCell(req, res);
    })

  }
}

new Server();