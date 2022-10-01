const express = require("express");
const { resolve } = require('path')
const fs = require("fs");

class File {
  server = null;
  port = 9080;
  subServer = {};
  timer = null;
  constructor() {
    this.server = express();
    this.initHeader();
    this.server.listen(this.port, () => {
      console.log("server run in port", this.port)
    })
  }

  async initHeader() {
    this.server.all("*", async (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "http://localhost:8080");
      res.header("Access-Control-Allow-Methods", "GET");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      this.getFile(req, res);
    })
  }

  getFile(req, res) {
    const url = resolve("./") + "/../static";
    const path = url + req.originalUrl;
    console.log(`请求资源`, path);
    fs.readFile(path, (error, data) => {
      res.send(data)
    })
  }
}
const file = new File();