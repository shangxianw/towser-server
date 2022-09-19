const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");

class App {
  server = null;
  port = 9090;
  subServer = {};
  timer = null;
  constructor() {
    this.server = express();
    this.initBodyParser();
    this.initHeader();
    this.server.listen(this.port, () => {
      console.log("server run in port", this.port)
    })
    this.timer = setInterval(() => {
      this.updateServer();
    }, 2000);
    this.updateServer();
  }

  // 没有这个的话,req.body为undefined
  initBodyParser() {
    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: false }));
  }

  async initHeader() {
    this.server.all("*", async (req, res) => {
      res.header("Access-Control-Allow-Origin", "http://localhost:8080");
      res.header("Access-Control-Allow-Methods", "GET, POST");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      if (req.method.toUpperCase() === "OPTIONS") {
        res.send("");
        return;
      }

      const key = this.getBestServer();
      if (!key) {
        res.send({
          code: 1001,
          msg: "当前无服务器可用",
          result: null
        });
        return;
      }
      this.axios2Server(key, req, res);
    })
  }

  axios2Server(key, req, res) {
    const isGet = req.method.toUpperCase() === "GET";
    const url = `${key}${req.params[0]}`;
    this.subServer[key]++;

    const api = () => {
      if (isGet) {
        const option = {
          params: { ...req.query },
          headers: {}
        }
        req.headers.cookie && (option.headers.Cookie = req.headers.cookie);
        return axios.get(url, option)
      } else {
        const option = {
          headers: {}
        }
        req.headers.cookie && (option.headers.Cookie = req.headers.cookie);
        return axios.post(url, req.body, option);
      }
    }
    api()
      .then(resp => {
        this.subServer[key]--;
        // res.send不接受数值类型，最好返回一个对象！
        res.send(resp.data);
      })
      .catch(err => {
        delete this.subServer[key];
        res.send({
          code: 1002,
          msg: "服务器请求失败",
          result: err
        });
        return;
      })
  }

  getBestServer() {
    let min = null;
    for (let key in this.subServer) {
      if (!min) {
        min = key;
        continue;
      }
      if (this.subServer[key] < this.subServer[min]) {
        min = key;
      }
    }
    return min;
  }

  updateServer() {
    const config = fs.readFile("./server.config.json", "utf-8", (error, data) => {
      if (error) return;
      const { servers } = JSON.parse(data);

      const arrs = servers.map(item => {
        return new Promise(async succ => {
          const [header, domain, port] = item;
          const key = `${header}://${domain}:${port}`;
          const isActive = await this.isServerActive(key);
          succ([key, isActive]);
        })
      })
      Promise.all(arrs).then(resps => {
        resps.forEach(result => {
          const [key, isActive] = result;
          if (!isActive) {
            delete this.subServer[key];
          } else {
            this.subServer[key] = this.subServer[key] || 0;
          }
        });
        if (Object.keys(this.subServer).length === 0) {
          console.log(`当前无活跃服务器`)
        } else {
          for (let key in this.subServer) {
            console.log(`当前活跃服务器`, key, this.subServer[key]);
          }
        }
        console.log("======================================")
      })
    })
  }

  isServerActive(key) {
    return new Promise(succ => {
      const url = `${key}/checkActive`
      axios.get(url)
        .then(resp => {
          succ(true)
        })
        .catch(err => {
          succ(false)
        })
    })
  }
}
const app = new App();