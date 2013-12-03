/**
 * Created by edwardzhou on 13-11-27.
 */

var ErrorCode = {
  // 成功，正常
  SUCCESS: 0,
  OK: 0,

  // 无效请求
  INVALID_REQUEST: 1001,
  // 非本轮玩家的请求
  NOT_IN_TURN: 1002,
  // 无效的叫地主分 (地主分必须>=0 <=3, 且>0时，必须大于前一个地主分)
  INVALID_GRAB_LORD_VALUE: 1003,

  // no use, just for a stub.
  STUB : -1
};

module.exports = ErrorCode;