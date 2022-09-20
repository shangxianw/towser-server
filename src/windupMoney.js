var mysql = require('mysql');

class WinupMoney {
  port = 9190;
  connection = {}
  constructor() {
    this.connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'towser'
    });
    this.connection.connect((a, b, c) => {
      console.log(`数据库towser已启动,`);

      this.windupBoom();
    });
  }

  async windupBoom() {
    const date = new Date();
    const todayStart = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 00:00:00.000`;
    const todayEnd = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 23:59:59.999`;
    const sql =
      `
      SELECT
        *
      FROM
      (
        SELECT
          activity.id, activity.money as activity_money,
          pass.user, pass.win_time,
          user.money
        from
          pass
        INNER JOIN
          activity
        ON
          activity.id = pass.activity
        INNER JOIN
          user
        ON
          pass.user = user.account
      ) as boom
      WHERE
        UNIX_TIMESTAMP(boom.win_time) < UNIX_TIMESTAMP('${todayEnd}')
      AND
        UNIX_TIMESTAMP(boom.win_time) >= UNIX_TIMESTAMP('${todayStart}');
      `
    this.query(sql).then(resp => {
      if (resp.code === 1) {
        const list = resp.result;
        const activityObj = {}
        const userObj = {};
        // 按照活动将用户归类
        list.forEach(item => {
          activityObj[item.id] = activityObj[item.id] || [];
          activityObj[item.id].push(item);
          userObj[item.user] = item.money;
        })

        for (let i in activityObj) {
          const passes = activityObj[i];
          const actMoney = passes[0].activity_money || 0;
          // 分到给每个人的钱
          const everyOneMoney = Number((actMoney / passes.length).toFixed(2));
          passes.forEach(item => {
            userObj[item.user] += everyOneMoney;
          });
        }

        let whenPart = "";
        for (let account in userObj) {
          whenPart += `WHEN "${account}" THEN ${userObj[account]}\n`;
        }
        const updateSql =
          `
          UPDATE user
              SET money = CASE account 
                  ${whenPart}
              END
          WHERE account IN (${Object.keys(userObj).map(account => `"${account}"`).join(", ")})
          `
        this.query(updateSql).then(resp => {
          if (resp.code === 1) { }
        })
      } else {
        2;
      }
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

new WinupMoney;