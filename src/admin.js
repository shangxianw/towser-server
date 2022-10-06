const axios = require("axios");
const mysqlUrl = "http://localhost:7707"

async function getSponsorList(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const sql =
      `
      SELECT
        id,
        name
      FROM
        sponsor
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result
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

async function getUserList(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const sql =
      `
      SELECT
        id,
        account
      FROM
        user
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result
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

async function getSponsorDetail(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const id = Number(req.query.id);
    const sql =
      `
      SELECT
        name,
        sponsor.desc
      FROM
        sponsor
      WHERE
        id = ${id}
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result[0]
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

async function getUserDetail(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const id = Number(req.query.id);
    const sql =
      `
      SELECT
        account,
        password,
        money,
        bank
      FROM
        user
      WHERE
        id = ${id}
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result[0];
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

async function updateSponsorDetail(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { id, name, desc } = req.body;
    const sql =
      `
      UPDATE
        sponsor
      SET
        sponsor.name = "${name}",
        sponsor.desc = "${desc}"
      WHERE
        id = ${id}
      `
    await axios.post(mysqlUrl, { sql });
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

async function updateUserDetail(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { id, password, money, bank } = req.body;
    const sql =
      `
      UPDATE
        user
      SET
        user.password = "${password}",
        user.money = "${money}",
        user.bank = "${bank}"
      WHERE
        id = ${id}
      `
    await axios.post(mysqlUrl, { sql });
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

async function addNewUser(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { account, password, money, bank } = req.body;
    const sql =
      `
      INSERT INTO
        user
        (account, password, money, bank)
      VALUES
        ("${account}", "${password}", ${money}, "${bank}")
      `
    await axios.post(mysqlUrl, { sql });
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

async function deleteUser(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { id } = req.body;
    const sql =
      `
      DELETE FROM
        user
      WHERE
        id=${id}
      `
    await axios.post(mysqlUrl, { sql });
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

async function addNewSpponsor(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { name, desc } = req.body;
    const sql =
      `
      INSERT INTO
        sponsor
        (name, sponsor.desc)
      VALUES
        ("${name}", "${desc}")
      `
    await axios.post(mysqlUrl, { sql });
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

async function deleteSponsor(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { id } = req.body;
    const sql =
      `
      DELETE FROM
        sponsor
      WHERE
        id = ${id}
      `
    await axios.post(mysqlUrl, { sql });
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

async function getCalcist(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const { type } = req.query;
    const typeSQL = {
      // 未开始
      0: `
          WHERE
            UNIX_TIMESTAMP(NOW()) < UNIX_TIMESTAMP(start)
          AND
            UNIX_TIMESTAMP(NOW()) < UNIX_TIMESTAMP(end)
          `,
      // 进行中
      1: `
          WHERE
            UNIX_TIMESTAMP(NOW()) >= UNIX_TIMESTAMP(start)
          AND
            UNIX_TIMESTAMP(NOW()) < UNIX_TIMESTAMP(end)
          `,
      // 未结算
      2: `
          WHERE
            UNIX_TIMESTAMP(NOW()) > UNIX_TIMESTAMP(end)
          AND
            activity.is_calc = 0
      
        `,
      // 已结算
      3: `
          WHERE
            UNIX_TIMESTAMP(NOW()) > UNIX_TIMESTAMP(end)
          AND
            activity.is_calc = 1
      
        `
    }
    const sql =
      `
      SELECT
        activity.id,
        activity.is_calc as isCalc,
        sponsor.name as sponsorName
      FROM
        activity
      INNER JOIN
        sponsor
      ON
        sponsor.id = activity.sponsor
      ${typeSQL[type]}
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result;
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

async function getCalcDetail(req, res) {
  const resp = {
    code: 1,
    msg: "",
    result: null
  }

  async function query() {
    const id = Number(req.query.id);
    const sql =
      `
      SELECT
        activity.money as money,
        activity.end as endTime,
        activity.is_calc as isCalc,
        sponsor.name as sponsorName
      FROM
        activity
      INNER JOIN
        sponsor
      ON
        sponsor.id = activity.sponsor
      WHERE
        activity.id = ${id};
      `
    const result = await axios.post(mysqlUrl, { sql });
    resp.result = result.data.result[0];
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
  getSponsorList,
  getSponsorDetail,
  updateSponsorDetail,
  getUserList,
  getUserDetail,
  updateUserDetail,
  addNewUser,
  deleteUser,
  addNewSpponsor,
  deleteSponsor,
  getCalcist,
  getCalcDetail
}