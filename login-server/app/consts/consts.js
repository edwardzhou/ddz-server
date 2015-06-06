/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var CONSTS = {
  Event:{
    chat: 'onChat',
    GameEvent: {
      // 玩家加入
      playerJoin: 'onPlayerJoin',
      // 玩家就绪/准备
      playerReady: 'onPlayerReady',
      // 游戏开始
      gameStart: 'onGameStart',
      // 抢地主
      grabLord: 'onGrabLord',
      // 倍数提升, 原因：抢地主，炸弹，春天/反春天
      lordValueUpgrade: 'onLordValueUpgrade',
      /**
       * @流局，无人叫地主
       */
      gameAbandonded: 'onGameAbandoned',
      // 打牌
      playCard: 'onPlayCard',
      // 游戏结束
      gameOver: 'onGameOver'
    }
  },

  PlayerRole: {
    NONE: 0,
    FARMER: 1,
    LORD: 2
  },

  PlayerState: {
    PREPARE_READY: 0,
    READY: 1,
    NO_GRAB_LORD: 2,
    GRAB_LORD: 3,
    PASS_GRAB_LORD: 4,
    RE_GRAB_LORD: 5,
    PLAYING: 6,
    DELEGATING: 7,
    GAME_OVER: 8,
    LEAVE_GAME: 9,
    NEW_GAME: 10
  },

  TableState: {
    IDLE: 0,
    BUSY: 1
  },

  GameState: {
    PENDING_FOR_READY: 0,
    ALL_READY: 1,
    GRABBING_LORD: 2,
    PLAYING: 3,
    GAME_OVER: 4
  },

  GrabLordType: {
    NONE: 0,
    GRAB: 1
  },

  GameAction: {
    ALL: -1,
    NONE: 0,
    PLAYER_JOIN: 1,
    PLAYER_READY: 2,
    GRAB_LORD: 3,
    DOUBLE_BET: 4,
    GAME_START: 5,
    PLAY_CARD: 6,
    GAME_OVER: 7

  },

  SignInType: {
    BY_AUTH_TOKEN: 1,
    BY_SESSION_TOKEN: 2,
    BY_PASSWORD: 3
  },

  AddFriendStatus: {
    NEW: 0,
    READ: 1,
    ACCEPTED: 2,
    DENIED: 3
  },

  MsgType: {
    ALL_MSG: 0,
    SYS_MSG: 1,
    ADD_FRIEND: 2,
    CHAT_MSG: 3
  },

  MsgStatus: {
    NEW: 0,
    DELIVERED: 1,
    READ: 2,
    DELETE: 3,
    ALL: -1
  },

  PokeCardValue: {
    NONE: 0,    // 无效
    THREE: 3,   // 3
    FOUR: 4,    // 4
    FIVE: 5,    // 5
    SIX: 6,     // 6
    SEVEN: 7,   // 7
    EIGHT: 8,   // 8
    NINE: 9,    // 9
    TEN: 10,    // 10
    JACK: 11,   // J
    QUEEN: 12,  // Q
    KING: 13,   // K
    ACE: 14,    // A
    TWO: 15,    // 2
    SMALL_JOKER: 16,  // 小王
    BIG_JOKER: 17     // 大王
  },

  CardType: {
    NONE                : 0, // 无效
    SINGLE              : 1, // 单张
    PAIRS               : 2, // 一对
    PAIRS_STRAIGHT      : 3, // 连对
    THREE               : 4, // 三张
    THREE_WITH_ONE      : 5, // 三带一
    THREE_WITH_PAIRS    : 6, // 三带一对
    THREE_STRAIGHT      : 7, // 三张的顺子
    FOUR_WITH_TWO       : 8, // 四带二
    FOUR_WITH_TWO_PAIRS : 9, // 四带二对
    PLANE               : 10, // 飞机
    PLANE_WITH_WING     : 11, // 飞机带翅膀(三张带一对的顺子)
    STRAIGHT            : 12, // 顺子
    BOMB                : 13, // 炸弹
    ROCKET              : 14 // 火箭(王炸)
  },

  PokeCardString: {},
  PokeCardTypeString: {},
  CardTypeString: {},

  STUB: null
};

CONSTS.PokeCardString[CONSTS.PokeCardValue.NONE] = " "
CONSTS.PokeCardString[CONSTS.PokeCardValue.THREE] = "3"
CONSTS.PokeCardString[CONSTS.PokeCardValue.FOUR] = "4"
CONSTS.PokeCardString[CONSTS.PokeCardValue.FIVE] = "5"
CONSTS.PokeCardString[CONSTS.PokeCardValue.SIX] = "6"
CONSTS.PokeCardString[CONSTS.PokeCardValue.SEVEN] = "7"
CONSTS.PokeCardString[CONSTS.PokeCardValue.EIGHT] = "8"
CONSTS.PokeCardString[CONSTS.PokeCardValue.NINE] = "9"
CONSTS.PokeCardString[CONSTS.PokeCardValue.TEN] = "0"
CONSTS.PokeCardString[CONSTS.PokeCardValue.JACK] = "J"
CONSTS.PokeCardString[CONSTS.PokeCardValue.QUEEN] = "Q"
CONSTS.PokeCardString[CONSTS.PokeCardValue.KING] = "K"
CONSTS.PokeCardString[CONSTS.PokeCardValue.ACE] = "A"
CONSTS.PokeCardString[CONSTS.PokeCardValue.TWO] = "2"
CONSTS.PokeCardString[CONSTS.PokeCardValue.SMALL_JOKER] = "w"
CONSTS.PokeCardString[CONSTS.PokeCardValue.BIG_JOKER] = "W"


CONSTS.CardTypeString[ CONSTS.CardType.NONE ]                  = "无效"
CONSTS.CardTypeString[ CONSTS.CardType.SINGLE ]                = "单张"
CONSTS.CardTypeString[ CONSTS.CardType.PAIRS ]                 = "一对"
CONSTS.CardTypeString[ CONSTS.CardType.PAIRS_STRAIGHT ]        = "连对"
CONSTS.CardTypeString[ CONSTS.CardType.THREE ]                 = "三张"
CONSTS.CardTypeString[ CONSTS.CardType.THREE_WITH_ONE ]        = "三带一"
CONSTS.CardTypeString[ CONSTS.CardType.THREE_WITH_PAIRS ]      = "三带一对"
CONSTS.CardTypeString[ CONSTS.CardType.THREE_STRAIGHT]         = "三张的顺子"
CONSTS.CardTypeString[ CONSTS.CardType.FOUR_WITH_TWO]          = "四带二"
CONSTS.CardTypeString[ CONSTS.CardType.FOUR_WITH_TWO_PAIRS ]   = "四带二对"
CONSTS.CardTypeString[ CONSTS.CardType.PLANE ]                 = "飞机"
CONSTS.CardTypeString[ CONSTS.CardType.PLANE_WITH_WING ]       = "飞机带翅膀"
CONSTS.CardTypeString[ CONSTS.CardType.STRAIGHT ]              = "顺子"
CONSTS.CardTypeString[ CONSTS.CardType.BOMB ]                  = "炸弹"
CONSTS.CardTypeString[ CONSTS.CardType.ROCKET ]                = "火箭"


module.exports = CONSTS;