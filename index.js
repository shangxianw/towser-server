const cluster = require("cluster");
const user = require("./src/user");
const activity = require("./src/activity");
const game = require("./src/game");

if (cluster.isMaster) {
	const numCPUs = require("os").cpus().length;
	console.log(`主进程 ${process.pid} 正在运行`);

	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker, code, signal) => {
		console.log(`工作进程 ${worker.process.pid} 已退出`);
	});
}
else {
	const express = require("express");
	const cookieParser = require("cookie-parser");
	const bodyParser = require("body-parser");
	const app = express();
	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.listen(80, () => {
		console.log(`服务器已启动, 访问地址为 http://localhost:80`)
	});
	app.all("*", (req, res, next) => {
		res.header("Access-Control-Allow-Origin", "http://localhost:8080");
		res.header("Access-Control-Allow-Methods", "GET, POST");
		res.header("Access-Control-Allow-Credentials", "true");
		res.header("Access-Control-Allow-Headers", "Content-Type");

		const flag = ["/login"].every(item => req.params[0] !== item)
		if (flag) {
			user.checkUserLogin(req, res, next);
		} else {
			next();
		}
	})

	app.get("/", (req, res) => {
		res.send("hello towser");
	})

	app.post("/login", (req, res) => {
		user.login(req, res);
	})

	app.get("/getUserInfo", (req, res) => {
		user.getUserInfo(req, res);
	})

	// 请求活动列表
	app.get("/getActivityList", (req, res) => {
		activity.getActivityList(req, res);
	})

	// 请求活动详情
	app.get("/getActivetyDetail", (req, res) => {
		activity.getActivetyDetail(req, res);
	})

	// 创建游戏
	app.get("/startGame", (req, res) => {
		game.startGame(req, res);
	})
}