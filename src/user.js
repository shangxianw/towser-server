const axios = require("axios");
const mysqlUrl = "http://localhost:7707"

async function getUserInfo(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const cookie = req.cookies["user"];
    const { account } = md5.decode(cookie);
    const sql =
      `
      SELECT
        money
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result = await axios.post(mysqlUrl, { sql });
    const { money } = result.data.result[0];
    resp.result = {
      money
    }
    res.send(resp);
  }

  try {
    await query();
  } catch ({ message, stack }) {
    resp.code = 2;
    resp.msg = "查询发生异常";
    resp.result = { message, stack };
    res.send(resp);
  }

  async function query() {
    const cookie = req.cookies["user"];
    const { account } = md5.decode(cookie);
    const sql =
      `
      SELECT
        money
      FROM
        user
      WHERE
        account = "${account}"
      `
    const result = await axios.post(mysqlUrl, { sql });
    const { money } = result.data.result[0];
    resp.result = {
      money
    }
    res.send(resp);
  }

  try {
    await query();
  } catch ({ message, stack }) {
    resp.code = 2;
    resp.msg = "查询发生异常";
    resp.result = { message, stack };
    res.send(resp);
  }
}

module.exports = {
  getUserInfo
}