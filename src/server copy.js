const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

class Server {
  app = null
  server = null;
  port = 9090;
  constructor(app) {
    this.app = app;
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

  async initHeader() {
    this.server.all("*", async (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "http://localhost:8080");
      res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
      // ?
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      // 正常请求，需要校验用户账号密码有效性
      if (req.params[0] !== "/login") {
        this.app.user.checkUserLogin(req, res, next);
      } else {
        next();
      }
    })
  }

  async initRoute() {
    this.server.get("/", (req, res) => {
      res.send("hello express")
    })

    this.server.get("/test", (req, res) => {
      res.send("hello express test")
    })

    this.server.post("/handleCount", async (req, res) => {
      this.app.user.login(req, res);
    })
  }
}

module.exports = Server;