/**
 * Created by edwardzhou on 15/4/8.
 */

var CalcService = require('../../app/services/calcService');
var GameRoom = require('../../app/domain/gameRoom');
var GameTable = require('../../app/domain/gameTable');
var Player = require('../../app/domain/player');
var PokeGame = require('../../app/domain/pokeGame');
var DdzProfile = require('../../app/domain/ddzProfile');
var PlayerState = require('../../app/consts/consts').PlayerState;
var PlayerRole = require('../../app/consts/consts').PlayerRole;

function createTestPlayers() {
  var players = [];

  var player;

  player = new Player();
  player.userId = 50001;
  player.nickName = '50001';
  player.ddzProfile = new DdzProfile();
  player.ddzProfile.userId = player.userId;
  player.ddzProfile.coins = 50000;
  players.push(player)

  player = new Player();
  player.userId = 50002;
  player.nickName = '50002';
  player.ddzProfile = new DdzProfile();
  player.ddzProfile.userId = player.userId;
  player.ddzProfile.coins = 50000;
  players.push(player)

  player = new Player();
  player.userId = 50003;
  player.nickName = '50003';
  player.ddzProfile = new DdzProfile();
  player.ddzProfile.userId = player.userId;
  player.ddzProfile.coins = 50000;
  players.push(player)

  return players;
}

function createTestRoom() {
  var gameRoom = new GameRoom();
  gameRoom.initRoom({noLoadRobot: true});
  gameRoom.roomId = 1000;
  gameRoom.rake = 500;
  gameRoom.ante = 2000;
  return gameRoom;
}

function createTestTable(gameRoom, players) {
  var table = new GameTable({tableId: 1, room: gameRoom, players: players});
  return table;
}

function createTestPokeGame(gameTable) {
  var pokeGame = PokeGame.newGame(gameTable);
  pokeGame.lordValue = 6;
  pokeGame.players[0].role = PlayerRole.LORD;
  pokeGame.players[1].role = PlayerRole.FARMER;
  pokeGame.players[2].role = PlayerRole.FARMER;
  return pokeGame;
}

function createTestCase() {
  var gameRoom = createTestRoom();
  var players = createTestPlayers();
  var gameTable = createTestTable(gameRoom, players);
  var pokeGame = createTestPokeGame(gameTable);

  var player = pokeGame.players[0];
  var player1 = pokeGame.getNextPlayer(player.userId);
  var player2 = pokeGame.getNextPlayer(player1.userId);

  var result = {ddzProfiles: {}};

  result.ddzProfiles[player.userId] = player.ddzProfile;
  result.ddzProfiles[player1.userId] = player1.ddzProfile;
  result.ddzProfiles[player2.userId] = player2.ddzProfile;
  pokeGame.playerResults = {};

  pokeGame.gameAnte = 5000; // 底注
  pokeGame.gameRake = 500; // 佣金
  pokeGame.lordValue = 6; // 地主分
  // 正常总分 = 5000 x 6 x 2 = 60000

  var score = pokeGame.score;
  score.spring = 0;
  score.rake = pokeGame.gameRake;
  score.ante = pokeGame.gameAnte;
  score.lordValue = pokeGame.lordValue;
  score.total = score.ante * score.lordValue * Math.pow(2, Math.abs(score.spring)) * 2;
  if (score.rake >= 1) {
    score.raked_total = score.total - score.rake;
  } else if (score.rake > 0) {
    score.raked_total = score.total * (1 - score.rake);
  }

  score.players = [];
  result.player = player; // result.player 代表赢的玩家, player 为地主
  result.player1 = player1; // result.player1 result. player2 代表另外两个
  result.player2 = player2;
  result.pokeGame = pokeGame;
  result.isEscape = false;
  return {pokeGame: pokeGame, player: player, player1: player1, player2: player2, result: result};
}


var testCalcGameOverEscapeFix = {};

/**
 * 测试用例 1
 * ~> 游戏地主逃跑
 * ~> 地主的金币充足
 * ~> 大家的金币都完全足够
 */
testCalcGameOverEscapeFix.case_1 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;

  player.ddzProfile.coins = 500000;
  player1.ddzProfile.coins = 100000;
  player2.ddzProfile.coins = 100000;

  CalcService.calcGameOverEscapeFix(result);

  var lose_total = -60000;
  var farmer1_win = 30000 - 250;
  var farmer2_win = 30000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == lose_total, 'lord expected lose %j, in fact: %j', lose_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_win, 'farmer1 expected win %j, in fact: %j', farmer1_win, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_win, 'farmer2 expected win %j, in fact: %j', farmer2_win, pokeGame.playersResults[player2.userId]);
};

/**
 * 测试用例 2
 * ~> 游戏地主逃跑
 * ~> 地主的金币充足
 * ~> 农民1 金币充足
 * ~> 农民2 金币少于应赢的金币
 */
testCalcGameOverEscapeFix.case_2 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;


  player.ddzProfile.coins =  100000;
  player1.ddzProfile.coins = 100000;
  player2.ddzProfile.coins = 20000;

  CalcService.calcGameOverEscapeFix(result);

  var lose_total = -50000;
  var farmer1_win = 30000 - 250;
  var farmer2_win = 20000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == lose_total, 'lord expected lose %j, in fact: %j', lose_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_win, 'farmer1 expected win %j, in fact: %j', farmer1_win, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_win, 'farmer2 expected win %j, in fact: %j', farmer2_win, pokeGame.playersResults[player2.userId]);
};

/**
 * 测试用例 3
 * ~> 游戏地主逃跑
 * ~> 地主的金币充足
 * ~> 农民1 金币不足
 * ~> 农民2 金币不足
 *
 */
testCalcGameOverEscapeFix.case_3 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;

  player.ddzProfile.coins = 1350000;
  player1.ddzProfile.coins = 15000;
  player2.ddzProfile.coins = 20000;

  CalcService.calcGameOverEscapeFix(result);

  var lose_total = -35000;
  var farmer1_win = 15000 - 250;
  var farmer2_win = 20000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == lose_total, 'lord expected lose %j, in fact: %j', lose_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_win, 'farmer1 expected win %j, in fact: %j', farmer1_win, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_win, 'farmer2 expected win %j, in fact: %j', farmer2_win, pokeGame.playersResults[player2.userId]);
};

/**
 * 测试用例 4
 * ~> 游戏地主逃跑
 * ~> 地主 金币不足
 * ~> 农民1 金币充足
 * ~> 农民2 金币不足
 *
 */
testCalcGameOverEscapeFix.case_4 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;


  player.ddzProfile.coins =  50000;
  player1.ddzProfile.coins = 315000;
  player2.ddzProfile.coins = 20000;

  CalcService.calcGameOverEscapeFix(result);

  var win_total = -50000;
  var farmer1_lose = 30000 - 250;
  var farmer2_lose = 20000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == win_total, 'lord expected lose %j, in fact: %j', win_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_lose, 'farmer1 expected win %j, in fact: %j', farmer1_lose, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_lose, 'farmer2 expected win %j, in fact: %j', farmer2_lose, pokeGame.playersResults[player2.userId]);
};


/**
 * 测试用例 5
 * ~> 游戏地主逃跑
 * ~> 地主 金币不足
 * ~> 农民1 金币不足
 * ~> 农民2 金币不足
 *
 */
testCalcGameOverEscapeFix.case_5 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;


  player.ddzProfile.coins =  50000;
  player1.ddzProfile.coins = 15000;
  player2.ddzProfile.coins = 20000;

  CalcService.calcGameOverEscapeFix(result);

  var win_total = -35000;
  var farmer1_lose = 15000 - 250;
  var farmer2_lose = 20000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == win_total, 'lord expected lose %j, in fact: %j', win_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_lose, 'farmer1 expected win %j, in fact: %j', farmer1_lose, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_lose, 'farmer2 expected win %j, in fact: %j', farmer2_lose, pokeGame.playersResults[player2.userId]);
};


/**
 * 测试用例 6
 * ~> 游戏地主逃跑
 * ~> 地主 金币不足
 * ~> 农民1 金币不足
 * ~> 农民2 金币不足
 *
 */
testCalcGameOverEscapeFix.case_6 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;


  player.ddzProfile.coins =  50000;
  player1.ddzProfile.coins = 5000;
  player2.ddzProfile.coins = 20000;

  CalcService.calcGameOverEscapeFix(result);

  var win_total = -25000;
  var farmer1_lose = 5000 - 250;
  var farmer2_lose = 20000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == win_total, 'lord expected lose %j, in fact: %j', win_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_lose, 'farmer1 expected win %j, in fact: %j', farmer1_lose, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_lose, 'farmer2 expected win %j, in fact: %j', farmer2_lose, pokeGame.playersResults[player2.userId]);
};


/**
 * 测试用例 7
 * ~> 游戏地主逃跑
 * ~> 地主 金币不足
 * ~> 农民1 金币不足
 * ~> 农民2 金币不足
 *
 */
testCalcGameOverEscapeFix.case_7 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;


  player.ddzProfile.coins =  50000;
  player1.ddzProfile.coins = 5000;
  player2.ddzProfile.coins = 40000;

  CalcService.calcGameOverEscapeFix(result);

  var win_total = -35000;
  var farmer1_lose = 5000 - 250;
  var farmer2_lose = 30000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == win_total, 'lord expected lose %j, in fact: %j', win_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_lose, 'farmer1 expected win %j, in fact: %j', farmer1_lose, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_lose, 'farmer2 expected win %j, in fact: %j', farmer2_lose, pokeGame.playersResults[player2.userId]);
};


/**
 * 测试用例 8
 * ~> 游戏地主逃跑
 * ~> 地主 金币不足
 * ~> 农民1 金币不足
 * ~> 农民2 金币不足
 *
 */
testCalcGameOverEscapeFix.case_8 = function () {
  var __ret = createTestCase();
  var pokeGame = __ret.pokeGame;
  var player = __ret.player;
  var player1 = __ret.player1;
  var player2 = __ret.player2;
  var result = __ret.result;


  player.ddzProfile.coins =  20000;
  player1.ddzProfile.coins = 5000;
  player2.ddzProfile.coins = 40000;

  CalcService.calcGameOverEscapeFix(result);

  var win_total = -20000;
  var farmer1_lose = 5000 - 250;
  var farmer2_lose = 15000 - 250;
  console.assert(pokeGame.playersResults[player.userId] == win_total, 'lord expected lose %j, in fact: %j', win_total, pokeGame.playersResults[player.userId]);
  console.assert(pokeGame.playersResults[player1.userId] == farmer1_lose, 'farmer1 expected win %j, in fact: %j', farmer1_lose, pokeGame.playersResults[player1.userId]);
  console.assert(pokeGame.playersResults[player2.userId] == farmer2_lose, 'farmer2 expected win %j, in fact: %j', farmer2_lose, pokeGame.playersResults[player2.userId]);
};

function runTestCases() {
  for (var key in testCalcGameOverEscapeFix) {
    console.log('run testCalcGameOverEscapeFix.%s ', key);
    testCalcGameOverEscapeFix[key]();
  }
}

runTestCases();