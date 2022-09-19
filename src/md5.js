const jwt = require('jsonwebtoken');

class MD5 {
  constructor() {

  }

  static encode(str, srcret = "towser") {
    const md5 = jwt.sign(str, srcret);
    return md5
  }

  static decode(token, srcret = "towser") {
    const data = jwt.verify(token, srcret);
    return data;
  }
}

module.exports = MD5;