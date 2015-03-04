/**
 * Created by edwardzhou on 13-12-11.
 */

var CardService = require('./cardService');
var messageService = require('./messageService');
var CheckSeqNoBeforeFilter = require('./filters/checkSeqNo');
var CancelActionTimeoutBeforeFilter = require('./filters/cancelActionTimeout');
var IncreaseSeqNoAfterFilter = require('./filters/increaseSeqNo');
var IncreasePlaysAfterFilter = require('./filters/increasePlays');
var GrabLordAction = require('./actions/grabLord');
var StartGameAction = require('./actions/startGame');
var PlayCardAction = require('./actions/playCard');
var GameOverAction = require('./actions/gameOver');
var GameAction = require('../consts/consts').GameAction;

var CardServiceFactory = function(opts) {

};

module.exports = CardServiceFactory;

CardServiceFactory.createNormalCardService = function() {
  var cardService = new CardService();
  cardService.messageService =messageService;

  var beforeFilters, afterFilters;

  beforeFilters = [CheckSeqNoBeforeFilter, CancelActionTimeoutBeforeFilter];
  afterFilters = [IncreaseSeqNoAfterFilter];
  cardService.configGameAction(GameAction.GRAB_LORD, GrabLordAction, beforeFilters, afterFilters);

  cardService.startGameAction = StartGameAction;

  beforeFilters = [CheckSeqNoBeforeFilter];
  afterFilters.push(IncreasePlaysAfterFilter);
  cardService.configGameAction(GameAction.PLAY_CARD, PlayCardAction, beforeFilters, afterFilters);

  cardService.gameOverAction = GameOverAction;


  return cardService;
};