const cluster = require("cluster");
const user = require("./src/user");
const activity = require("./src/activity");
const game = require("./src/game");
const boom = require("./src/boom");
const admin = require("./src/admin");

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
	app.use(bodyParser.json({ limit: '5mb' }));
	app.use(bodyParser.urlencoded({ extended: false, limit: '5mb', extended: true }));
	app.listen(7788, () => {
		console.log(`服务器已启动, 访问地址为 http://localhost:7788`)
	});
	app.all("*", (req, res, next) => {
		res.header("Access-Control-Allow-Origin", req.headers.origin);
		res.header("Access-Control-Expose-Headers", "Authorization");
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

	app.get("/getUserInfo2", (req, res) => {
		user.getUserInfo2(req, res);
	})

	app.get("/getWellInfo", (req, res) => {
		user.getWellInfo(req, res);
	})

	app.post("/well", (req, res) => {
		user.well(req, res);
	})

	app.get("/getWellRecords", (req, res) => {
		user.getWellRecords(req, res);
	})

	app.post(`/updateUserInfo`, (req, res) => {
		user.updateUserInfo(req, res);
	})

	// 请求活动列表
	app.get("/getActivityList", (req, res) => {
		activity.getActivityList(req, res);
	})

	// 请求预告活动列表
	app.get("/getForeActivityList", (req, res) => {
		activity.getForeActivityList(req, res);
	})

	// 请求活动详情
	app.get("/getActivetyDetail", (req, res) => {
		activity.getActivetyDetail(req, res);
	})

	// 请求通关玩家列表
	app.get("/getWinPlayerList", (req, res) => {
		activity.getWinPlayerList(req, res);
	})

	// 检查游戏是否能开始
	app.get("/checkCanStart", (req, res) => {
		game.checkCanStart(req, res);
	})

	// 创建游戏
	app.get("/startGame", (req, res) => {
		game.startGame(req, res);
	})

	//////////////////////////////////// 扫雷
	// 点击单元格
	app.post("/openBoomCell", (req, res) => {
		boom.openBoomCell(req, res);
	})


	//////////////////////////////////// admin
	app.get("/getUserList", (req, res) => {
		admin.getUserList(req, res);
	})

	app.get("/getUserDetail", (req, res) => {
		admin.getUserDetail(req, res);
	})

	app.post("/updateUserDetail", (req, res) => {
		admin.updateUserDetail(req, res);
	})

	app.post("/addNewUser", (req, res) => {
		admin.addNewUser(req, res);
	})

	app.post("/deleteUser", (req, res) => {
		admin.deleteUser(req, res);
	})

	app.post("/addNewSpponsor", (req, res) => {
		admin.addNewSpponsor(req, res);
	})

	app.get("/getCalcist", (req, res) => {
		admin.getCalcist(req, res);
	})

	app.get("/getCalcDetail", (req, res) => {
		admin.getCalcDetail(req, res);
	})

	app.get("/getWinPlayer", (req, res) => {
		activity.getWinPlayer(req, res);
	})

	app.post("/calcActivity", (req, res) => {
		activity.calcActivity(req, res);
	})

	app.post("/addNewActivity", (req, res) => {
		activity.addNewActivity(req, res);
	})
}