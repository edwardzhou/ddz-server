module.exports = {
  Event:{
    chat:'onChat'
  },

  PlayerState: {
    prepareReady: 0,
    ready: 1,
    grabLord: 2,
    playCard: 3,
    tuoGuan: 4,
    gameOver: 5,
    leaveGame: 6
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

  STUB: null
};