/**
 * Created by edwardzhou on 13-11-27.
 */

var ErrorCode = {
  // 成功，正常
  SUCCESS: 0,
  OK: 0,

  // 连接未授权
  CONNECTION_NOT_AUTHED: 10,
  // 连接授权失败
  CONNECTION_AUTH_FAILED: 11,
  // 客户端版本被禁用
  CLIENT_APP_VERSION_PROHIBITTED: 12,
  // 客户端设备被禁用
  CLIENT_DEVICE_PROHIBITTED: 13,
  // 未登录
  CLIENT_NOT_SIGNED_YET: 14,
  // 链接握手无效
  CONNECTION_HANDSAKE_INVALID: 15,

  // 用户不存在
  USER_NOT_FOUND: 100,
  // 用户被禁用
  USER_PROHIBITTED: 110,
  // 密码不匹配
  PASSWORD_INCORRECT: 101,
  // 登录token无效
  AUTH_TOKEN_INVALID: 102,
  // 会话token过期
  SESSION_TOKEN_EXPIRED: 103,
  // 无登录奖励记录
  LOGIN_REWARD_NULL: 104,

  // 无效请求
  INVALID_REQUEST: 1001,
  // 非本轮玩家的请求
  NOT_IN_TURN: 1002,
  // 无效的叫地主分 (地主分必须>=0 <=3, 且>0时，必须大于前一个地主分)
  INVALID_GRAB_LORD_VALUE: 1003,

  // 桌子已经有3个用户
  TABLE_FULL: 2001,
  // 牌桌已经解散
  TABLE_RELEASED: 2002,
  CANNOT_ENTER_ROOM: 2100,

  // 约战不存在
  APPOINT_PLAY_NOT_EXISTS: 2200,
  // 用户不属于该约战的成员
  APPOINT_HAS_NO_SUCH_PLAYER: 2001,

  // 无效牌型
  INVALID_CARD_TYPE: 3001,
  // 牌型打不过上手牌（1. 牌型不配， 2. 没有大过对方）
  INVALID_PLAY_CARD: 3002,

  // 无法进入房间,金币不足
  COINS_NOT_ENOUGH: 5000,

  // 数据不存在
  DATA_NOT_FOUND: 10001,

  SYSTEM_ERROR: 100000,

  // no use, just for a stub.
  STUB : -1
};

var ErrorMessages = {};
ErrorMessages[ErrorCode.CONNECTION_NOT_AUTHED] = '连接未授权';
// 连接授权失败
ErrorMessages[ErrorCode.CONNECTION_AUTH_FAILED] = '连接授权失败';
  // 客户端版本被禁用
ErrorMessages[ErrorCode.CLIENT_APP_VERSION_PROHIBITTED] = '客户端版本被禁用';
  // 客户端设备被禁用
ErrorMessages[ErrorCode.CLIENT_DEVICE_PROHIBITTED] = '客户端设备被禁用';
// 未登录
ErrorMessages[ErrorCode.CLIENT_NOT_SIGNED_YET] = '未登录';

// 用户不存在
ErrorMessages[ErrorCode.USER_NOT_FOUND] = '用户不存在';
// 用户被禁用
ErrorMessages[ErrorCode.USER_PROHIBITTED] = '用户被禁用';
// 密码不匹配
ErrorMessages[ErrorCode.PASSWORD_INCORRECT] = '密码不匹配';
// 登录token无效
ErrorMessages[ErrorCode.AUTH_TOKEN_INVALID] = '登录token无效';
// 会话token过期
ErrorMessages[ErrorCode.SESSION_TOKEN_EXPIRED] = '会话token过期';
// 无登录奖励记录
ErrorMessages[ErrorCode.LOGIN_REWARD_NULL] = '无登录奖励记录';

ErrorCode.getErrorMessage = function(errCode) {
  return ErrorMessages[errCode];
};


module.exports = ErrorCode;