module.exports = {
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
    GRABBING_LORD: 2,
    PLAYING: 3,
    DELEGATING: 4,
    GAME_OVER: 5,
    LEAVE_GAME: 6
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

  STUB: null
};