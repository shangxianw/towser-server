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

module.exports = {
  getSponsorList,
  getSponsorDetail,
  updateSponsorDetail
}