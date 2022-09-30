const cluster = require("cluster");

if (cluster.isMaster) {
	const numCPUs = require('os').cpus().length;
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
	app.all("*", async (req, res, next) => {
		res.header("Access-Control-Allow-Origin", "*"); // http://localhost:80
		res.header("Access-Control-Allow-Methods", "GET, POST");
		res.header("Access-Control-Allow-Credentials", "true");
		res.header("Access-Control-Allow-Headers", "Content-Type");

		res.send("hello app");
	})
}