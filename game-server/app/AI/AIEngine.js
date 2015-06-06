/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var Combinatorics = require('js-combinatorics').Combinatorics;

var CardAnalyzer = require('./CardAnalyzer');
var cardUtil = require('../util/cardUtil');
var CardResult = require('./CardResult');
var CardInfo = require('./CardInfo');
var Card = require('../domain/card');
var CONST = require('../consts/consts');
var CardType = CONST.CardType;
var PokeCardValue = CONST.PokeCardValue;

var AIEngine = function() {
};

AIEngine.playCard = function (curPlayer, nextPlayer, prevPlayer, lastPlayer, lastCard) {
  var firstCard;

  var next_player_cardInfo = CardInfo.create(nextPlayer.pokeCards);
  CardAnalyzer.analyze(next_player_cardInfo);
  var cur_player_cardInfo = CardInfo.create(curPlayer.pokeCards);
  CardAnalyzer.analyze(cur_player_cardInfo);
  var last_player_cardInfo = CardInfo.create(lastPlayer.pokeCards);
  CardAnalyzer.analyze(last_player_cardInfo);
  var prev_player_cardInfo = CardInfo.create(prevPlayer.pokeCards);
  CardAnalyzer.analyze(prev_player_cardInfo);

  logger.info("curPlayer [%d] : hands=%d, role=%s", curPlayer.userId, cur_player_cardInfo.cardPlans[0].hands, curPlayer.role);
  logger.info("nextPlayer [%d] : hands=%d, role=%s", nextPlayer.userId, next_player_cardInfo.cardPlans[0].hands, nextPlayer.role);
  logger.info("lastPlayer [%d] : hands=%d, role=%s", lastPlayer.userId, last_player_cardInfo.cardPlans[0].hands, lastPlayer.role);
  logger.info("lastPlayer [%d] : last_card.maxPokeValue=%d, last_card.pokeCards.length=%d",lastPlayer.userId, lastCard.maxPokeValue, lastCard.pokeCards.length);


  if (lastPlayer.userId == curPlayer.userId) {
    // 有牌权
    // 如果手中有多于一手的牌
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 下家只有一手牌
      if (next_player_cardInfo.cardPlans[0].hands == 1) {
        var next_last_card = new Card(next_player_cardInfo.pokeCards);
        // 下家为友方
        if (nextPlayer.role == curPlayer.role) {
          // 找出与友方相同牌形的最小牌打出
          firstCard = AIEngine.findSmallerThan(next_last_card, cur_player_cardInfo).card;
        }
        else  // 下家为敌方
        {
          // 打出手中牌值最大的牌
          firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, next_last_card).card;
        }
      }
      // 下家手中有多于一手的牌 或面过程未找到有效牌
      // 手中只有最后两手牌
      if (firstCard == null && cur_player_cardInfo.cardPlans[0].hands == 2) {
        // 如最后两手为单 或 对，则先出牌值小的
        // 如最后两手牌为单或对 加 其它组合，则单 或对 最后出
        firstCard = AIEngine.playLastTwoHandCard(cur_player_cardInfo, prev_player_cardInfo, next_player_cardInfo);

      }
      if (firstCard == null)
      {
        firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
      }
    }
    else // 手中只有一手牌，则直接打出
    {
      firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
    }

  } else {
    // 无牌权
    // 手中有不止一手牌
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 最后出牌者是友方
      if (lastPlayer.role == curPlayer.role) {
        // 友方剩最后一手牌
        if (last_player_cardInfo.cardPlans[0].hands == 1){

        }
        else // 友方不手中不止一手牌，或所出牌牌值小于10，或所出牌小于3张
        {
          var tmpFirstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
          if (!!tmpFirstCard && tmpFirstCard.weight < 10){
            firstCard = tmpFirstCard;
          }
        }
      }
      else // 最后出牌者是敌方
      {
        firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
      }
    }
    else{
      firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
    }
  }

    return firstCard;
};

AIEngine.canGrabLoad = function (curPlayer, nextPlayer, prevPlayer) {
  var grabLoad = 0;

  var next_player_cardInfo = CardInfo.create(nextPlayer.pokeCards);
  CardAnalyzer.analyze(next_player_cardInfo);
  var cur_player_cardInfo = CardInfo.create(curPlayer.pokeCards);
  CardAnalyzer.analyze(cur_player_cardInfo);
  var prev_player_cardInfo = CardInfo.create(prevPlayer.pokeCards);
  CardAnalyzer.analyze(prev_player_cardInfo);

  //if (cur_player_cardInfo.grabLoadWeight >= 3 &&
  //    cur_player_cardInfo.cardPlans[0].hands <= next_player_cardInfo.cardPlans[0].hands &&
  //        cur_player_cardInfo.cardPlans[0].hands <= prev_player_cardInfo.cardPlans[0].hands) {
  //  grabLoad = 1;
  //}

  if (cur_player_cardInfo.grabLoadWeight >= 3) {
    grabLoad = 1;
    curPlayer.everGrabLard = true;
  }

  return grabLoad;
};

AIEngine.playCardLevel2 = function (curPlayer, nextPlayer, prevPlayer, lastPlayer, lastCard) {
  var firstCard;

  var next_player_cardInfo = CardInfo.create(nextPlayer.pokeCards);
  CardAnalyzer.analyze(next_player_cardInfo);
  var cur_player_cardInfo = CardInfo.create(curPlayer.pokeCards);
  CardAnalyzer.analyze(cur_player_cardInfo);
  var last_player_cardInfo = CardInfo.create(lastPlayer.pokeCards);
  CardAnalyzer.analyze(last_player_cardInfo);
  var prev_player_cardInfo = CardInfo.create(prevPlayer.pokeCards);
  CardAnalyzer.analyze(prev_player_cardInfo);

  logger.info("curPlayer [%d] : hands=%d, role=%s", curPlayer.userId, cur_player_cardInfo.cardPlans[0].hands, curPlayer.role);
  logger.info("nextPlayer [%d] : hands=%d, role=%s", nextPlayer.userId, next_player_cardInfo.cardPlans[0].hands, nextPlayer.role);
  logger.info("lastPlayer [%d] : hands=%d, role=%s", lastPlayer.userId, last_player_cardInfo.cardPlans[0].hands, lastPlayer.role);
  logger.info("lastPlayer [%d] : last_card.maxPokeValue=%d, last_card.pokeCards.length=%d",lastPlayer.userId, lastCard.maxPokeValue, lastCard.pokeCards.length);


  if (lastPlayer.userId == curPlayer.userId) {
    // 有牌权
    // 如果手中有多于一手的牌
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 下家或下下家只有一手牌
      if (next_player_cardInfo.cardPlans[0].hands == 1 || prev_player_cardInfo.cardPlans[0].hands == 1) {
        var next_last_card = new Card(prev_player_cardInfo.pokeCards);
        if (next_player_cardInfo.cardPlans[0].hands == 1)
          next_last_card = new Card(next_player_cardInfo.pokeCards);
        // 下家为友方
        if (nextPlayer.role == curPlayer.role) {
          // 找出与友方相同牌形的最小牌打出
          firstCard = AIEngine.findSmallerThan(next_last_card, cur_player_cardInfo).card;
        }
        else  // 下家为敌方
        {
          // 打出手中牌值最大的牌
          firstCard = AIEngine.findDiffTypePlayCard(cur_player_cardInfo, next_last_card);
          if (!firstCard) {
            firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, next_last_card).card;
          }

        }
      }

      // 下家手中有多于一手的牌 或面过程未找到有效牌
      // 手中只有最后两手牌
      if (firstCard == null && cur_player_cardInfo.cardPlans[0].hands == 2) {
        // 如最后两手为单 或 对，则先出牌值小的
        // 如最后两手牌为单或对 加 其它组合，则单 或对 最后出
        firstCard = AIEngine.playLastTwoHandCard(cur_player_cardInfo, prev_player_cardInfo, next_player_cardInfo);

      }
      if (firstCard == null)
      {
        firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
      }
    }
    else // 手中只有一手牌，则直接打出
    {
      firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
    }

  } else {
    // 无牌权
    // 手中有不止一手牌
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 最后出牌者是友方
      if (lastPlayer.role == curPlayer.role) {
        // 友方剩最后一手牌 或者友方的最后所出牌牌值大于等于10 或者所出牌为三张以上
        if (last_player_cardInfo.cardPlans[0].hands == 1){

        }
        else // 友方不手中不止一手牌，或所出牌牌权小于10
        {
          var tmpFirstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
          if (!!tmpFirstCard && (tmpFirstCard.weight < 10 || next_player_cardInfo.cardPlans[0].hands < 3)){
            firstCard = tmpFirstCard;
          }
        }
      }
      else // 最后出牌者是敌方
      {
        firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
      }
    }
    else{
      firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
    }
  }

  return firstCard;
};

AIEngine.playCardLevel3 = function (curPlayer, nextPlayer, prevPlayer, lastPlayer, lastCard) {
  logger.info("AIEngine.playCardLevel3 ");
  var firstCard;

  var next_player_cardInfo = CardInfo.create(nextPlayer.pokeCards);
  CardAnalyzer.analyze(next_player_cardInfo);
  var cur_player_cardInfo = CardInfo.create(curPlayer.pokeCards);
  CardAnalyzer.analyze(cur_player_cardInfo);
  var last_player_cardInfo = CardInfo.create(lastPlayer.pokeCards);
  CardAnalyzer.analyze(last_player_cardInfo);
  var prev_player_cardInfo = CardInfo.create(prevPlayer.pokeCards);
  CardAnalyzer.analyze(prev_player_cardInfo);

  logger.info("curPlayer [%d] : hands=%d, role=%s", curPlayer.userId, cur_player_cardInfo.cardPlans[0].hands, curPlayer.role);
  logger.info("nextPlayer [%d] : hands=%d, role=%s", nextPlayer.userId, next_player_cardInfo.cardPlans[0].hands, nextPlayer.role);
  logger.info("lastPlayer [%d] : hands=%d, role=%s", lastPlayer.userId, last_player_cardInfo.cardPlans[0].hands, lastPlayer.role);
  logger.info("lastPlayer [%d] : last_card.maxPokeValue=%d, last_card.pokeCards.length=%d",lastPlayer.userId, lastCard.maxPokeValue, lastCard.pokeCards.length);


  if (lastPlayer.userId == curPlayer.userId) {
    logger.info("Have right to play card.");
    // 有牌权
    // 如果手中有多于一手的牌
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 下家或下下家只有一手牌
      if (next_player_cardInfo.cardPlans[0].hands == 1) {
        logger.info("Have right to play card. nextPlayer has only one hand card.");
        var next_last_card = new Card(next_player_cardInfo.pokeCards);
        // 下家为友方
        if (nextPlayer.role == curPlayer.role) {
          // 找出与友方相同牌形的最小牌打出
          logger.info("Have right to play card. play the smaller card to let friend run.");
          firstCard = AIEngine.findSmallerThan(next_last_card, cur_player_cardInfo).card;
        }
        else  // 下家为敌方
        {
          // 打出手中牌值最大的牌
          firstCard = AIEngine.findDiffTypePlayCard(cur_player_cardInfo, next_last_card);
          if (!firstCard) {
            logger.info("Have right to play card. play greater card to cover enemy's card.");
            firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, next_last_card).card;
          }
          else {
            logger.info("Have right to play card. play the diff type card to cover enemy's card.");
          }

        }
      }
      else  if (prev_player_cardInfo.cardPlans[0].hands == 1) {
        logger.info("Have right to play card. prevPlayer has only one hand card.");
        var prev_last_card = new Card(prev_player_cardInfo.pokeCards);
        // 下下家为友方
        if (curPlayer.role == prevPlayer.role) {
          // 找出与友方相同牌形的最小牌打出
          logger.info("Have right to play card. play the smaller card to let friend run.");
          firstCard = AIEngine.findSmallerThan(prev_last_card, cur_player_cardInfo).card;
        }
        else  // 下下家为敌方
        {
          // 打出手中牌值最大的牌
          firstCard = AIEngine.findDiffTypePlayCard(cur_player_cardInfo, prev_last_card);
          if (!firstCard) {
            logger.info("Have right to play card. play greater card to cover enemy's card.");
            firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, prev_last_card).card;
          }
          else {
            logger.info("Have right to play card. play the diff type card to cover enemy's card.");
          }
        }
      }

      // 下家手中有多于一手的牌 或面过程未找到有效牌
      // 手中只有最后两手牌
      if (firstCard == null && cur_player_cardInfo.cardPlans[0].hands == 2) {
        // 如最后两手为单 或 对，则先出牌值小的
        // 如最后两手牌为单或对 加 其它组合，则单 或对 最后出
        logger.info("Have right to play card. curPlayer only have two hands card.");
        firstCard = AIEngine.playLastTwoHandCard(cur_player_cardInfo, prev_player_cardInfo, next_player_cardInfo);

      }
      if (firstCard == null)
      {
        logger.info("Have right to play card. curPlayer just play an any card.");
        firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
      }
    }
    else // 手中只有一手牌，则直接打出
    {
      logger.info("Have right to play card. curPlayer play the last card.");
      firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
    }

  } else {
    // 无牌权
    // 手中有不止一手牌
    logger.info("No right to play card.");
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 最后出牌者是友方
      if (lastPlayer.role == curPlayer.role) {
        // 友方剩最后一手牌 或者友方的最后所出牌牌值大于等于10 或者所出牌为三张以上
        if (last_player_cardInfo.cardPlans[0].hands == 1){
          logger.info("No right to play card. do not cover friend's card, let it run.");
        }
        else // 友方不手中不止一手牌，或所出牌牌权小于10
        {
          var tmpCardResult = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard);
          var tmpFirstCard = tmpCardResult.card;
          if (!!tmpFirstCard && ((tmpFirstCard.weight < 10 && !tmpCardResult.breakCard) ||
              (cur_player_cardInfo.cardPlans[0].hands < last_player_cardInfo.cardPlans[0].hands) ||
              next_player_cardInfo.cardPlans[0].hands < 3)){
            firstCard = tmpFirstCard;
            logger.info("No right to play card. cover friend's card.");
          }
          else{
            logger.info("No right to play card. do not cover friend's card.");
          }
        }
      }
      else // 最后出牌者是敌方
      {
        logger.info("No right to play card. cover enemy's card.");
        firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
      }
    }
    else{
      logger.info("No right to play card. curPlayer play the last card.");
      firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
    }
  }

  return firstCard;
};

AIEngine.getBestPowerCardInfo = function (pokeCards1, pokeCards2) {
  //Combinatorics.combination
  var concat_pokeCards = pokeCards1.concat(pokeCards2);
  var cardInfo = CardInfo.create(concat_pokeCards);
  CardAnalyzer.analyze(cardInfo);
  var cardPlan = cardInfo.cardPlans[0];
  //this.singlesCards = [];
  //this.pairsCards = [];
  //this.threesCards = [];
  //this.bombsCards = [];
  //this.rocketsCards = [];
  //this.pairsStraightsCards = [];
  //this.threesStraightsCards = [];
  //this.straightsCards = [];
  var newPokeCards = [];
  if (!!cardPlan.rocketsCards && cardPlan.rocketsCards.length > 0) {
    for (var index=0;index<cardPlan.rocketsCards.length;index++){
      var tmpCard = cardPlan.rocketsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }
  if (newPokeCards.length < pokeCards1.length && !!cardPlan.bombsCards && cardPlan.bombsCards.length > 0) {
    for (var index=0;index<cardPlan.bombsCards.length;index++){
      var tmpCard = cardPlan.bombsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }
  if (newPokeCards.length < pokeCards1.length && !!cardPlan.threesStraightsCards && cardPlan.threesStraightsCards.length > 0) {
    for (var index=0;index<cardPlan.threesStraightsCards.length;index++){
      var tmpCard = cardPlan.threesStraightsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.pairsStraightsCards && cardPlan.pairsStraightsCards.length > 0) {
    for (var index=0;index<cardPlan.pairsStraightsCards.length;index++){
      var tmpCard = cardPlan.pairsStraightsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.straightsCards && cardPlan.straightsCards.length > 0) {
    for (var index=0;index<cardPlan.straightsCards.length;index++){
      var tmpCard = cardPlan.straightsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.threesCards && cardPlan.threesCards.length > 0) {
    for (var index=0;index<cardPlan.threesCards.length;index++){
      var tmpCard = cardPlan.threesCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.pairsCards && cardPlan.pairsCards.length > 0) {
    for (var index=0;index<cardPlan.pairsCards.length;index++){
      var tmpCard = cardPlan.pairsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.singlesCards && cardPlan.singlesCards.length > 0) {
    for (var index=0;index<cardPlan.singlesCards.length;index++){
      var tmpCard = cardPlan.singlesCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }
  newPokeCards = cardUtil.sortPokeCards(newPokeCards);
  var newCardInfo = CardInfo.create(newPokeCards);
  CardAnalyzer.analyze(newCardInfo);

  var leftPokeCards = [];
  for (var i=0;i<concat_pokeCards.length;i++){
    var used = false;
    for (var j=0;j<newPokeCards.length;j++){
      if (concat_pokeCards[i].pokeChar == newPokeCards[j].pokeChar){
        used = true;
      }
    }
    if (!used){
      leftPokeCards.push(concat_pokeCards[i]);
    }
  }
  leftPokeCards = cardUtil.sortPokeCards(leftPokeCards);
  return [newCardInfo,leftPokeCards];
};

AIEngine.getBestCardInfo = function (pokeCards1, pokeCards2) {
  //Combinatorics.combination
  var concat_pokeCards = pokeCards1.concat(pokeCards2);
  var cardInfo = CardInfo.create(concat_pokeCards);
  CardAnalyzer.analyze(cardInfo);
  var cardPlan = cardInfo.cardPlans[0];
  //this.singlesCards = [];
  //this.pairsCards = [];
  //this.threesCards = [];
  //this.bombsCards = [];
  //this.rocketsCards = [];
  //this.pairsStraightsCards = [];
  //this.threesStraightsCards = [];
  //this.straightsCards = [];
  var newPokeCards = [];
  if (!!cardPlan.rocketsCards && cardPlan.rocketsCards.length > 0) {
    for (var index=0;index<cardPlan.rocketsCards.length;index++){
      var tmpCard = cardPlan.rocketsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.straightsCards && cardPlan.straightsCards.length > 0) {
    for (var index=0;index<cardPlan.straightsCards.length;index++){
      var tmpCard = cardPlan.straightsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.pairsStraightsCards && cardPlan.pairsStraightsCards.length > 0) {
    for (var index=0;index<cardPlan.pairsStraightsCards.length;index++){
      var tmpCard = cardPlan.pairsStraightsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.threesStraightsCards && cardPlan.threesStraightsCards.length > 0) {
    for (var index=0;index<cardPlan.threesStraightsCards.length;index++){
      var tmpCard = cardPlan.threesStraightsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.threesCards && cardPlan.threesCards.length > 0) {
    for (var index=0;index<cardPlan.threesCards.length;index++){
      var tmpCard = cardPlan.threesCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.bombsCards && cardPlan.bombsCards.length > 0) {
    for (var index=0;index<cardPlan.bombsCards.length;index++){
      var tmpCard = cardPlan.bombsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.pairsCards && cardPlan.pairsCards.length > 0) {
    for (var index=0;index<cardPlan.pairsCards.length;index++){
      var tmpCard = cardPlan.pairsCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }

  if (newPokeCards.length < pokeCards1.length && !!cardPlan.singlesCards && cardPlan.singlesCards.length > 0) {
    for (var index=0;index<cardPlan.singlesCards.length;index++){
      var tmpCard = cardPlan.singlesCards[index];
      for (var i=0; i<tmpCard.pokeCards.length;i++) {
        if (newPokeCards.length < pokeCards1.length) {
          newPokeCards.push(tmpCard.pokeCards[i]);
        }
      }
    }
  }
  newPokeCards = cardUtil.sortPokeCards(newPokeCards);
  var newCardInfo = CardInfo.create(newPokeCards);
  CardAnalyzer.analyze(newCardInfo);

  var leftPokeCards = [];
  for (var i=0;i<concat_pokeCards.length;i++){
    var used = false;
    for (var j=0;j<newPokeCards.length;j++){
      if (concat_pokeCards[i].pokeChar == newPokeCards[j].pokeChar){
        used = true;
      }
    }
    if (!used){
      leftPokeCards.push(concat_pokeCards[i]);
    }
  }
  leftPokeCards = cardUtil.sortPokeCards(leftPokeCards);
  return [newCardInfo,leftPokeCards];
};

AIEngine.playCardLevel4 = function (curPlayer, nextPlayer, prevPlayer, lastPlayer, lastCard, pokeGame) {
  logger.info("AIEngine.playCardLevel4 ");
  var firstCard;

  var next_player_cardInfo = CardInfo.create(nextPlayer.pokeCards);
  CardAnalyzer.analyze(next_player_cardInfo);
  var cur_player_cardInfo = CardInfo.create(curPlayer.pokeCards);
  CardAnalyzer.analyze(cur_player_cardInfo);
  var last_player_cardInfo = CardInfo.create(lastPlayer.pokeCards);
  CardAnalyzer.analyze(last_player_cardInfo);
  var prev_player_cardInfo = CardInfo.create(prevPlayer.pokeCards);
  CardAnalyzer.analyze(prev_player_cardInfo);

  logger.info("curPlayer [%d] : hands=%d, role=%s", curPlayer.userId, cur_player_cardInfo.cardPlans[0].hands, curPlayer.role);
  logger.info("nextPlayer [%d] : hands=%d, role=%s", nextPlayer.userId, next_player_cardInfo.cardPlans[0].hands, nextPlayer.role);
  logger.info("lastPlayer [%d] : hands=%d, role=%s", lastPlayer.userId, last_player_cardInfo.cardPlans[0].hands, lastPlayer.role);
  logger.info("lastPlayer [%d] : last_card.maxPokeValue=%d, last_card.pokeCards.length=%d",lastPlayer.userId, lastCard.maxPokeValue, lastCard.pokeCards.length);

  if (lastPlayer.userId == curPlayer.userId) {
    logger.info("Have right to play card.");
    // 有牌权
    // 如果手中有多于一手的牌
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 下家或下下家只有一手牌
      if (next_player_cardInfo.cardPlans[0].hands == 1) {
        logger.info("Have right to play card. nextPlayer has only one hand card.");
        var next_last_card = new Card(next_player_cardInfo.pokeCards);
        // 下家为友方
        if (nextPlayer.role == curPlayer.role) {
          // 找出与友方相同牌形的最小牌打出
          logger.info("Have right to play card. play the smaller card to let friend run.");
          firstCard = AIEngine.findSmallerThan(next_last_card, cur_player_cardInfo).card;
        }
        else  // 下家为敌方
        {
          // 打出手中牌值最大的牌
          firstCard = AIEngine.findDiffTypePlayCard(cur_player_cardInfo, next_last_card);
          if (!firstCard) {
            logger.info("Have right to play card. play greater card to cover enemy's card.");
            firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, next_last_card).card;
          }
          else {
            logger.info("Have right to play card. play the diff type card to cover enemy's card.");
          }

        }
      }
      else  if (prev_player_cardInfo.cardPlans[0].hands == 1) {
        logger.info("Have right to play card. prevPlayer has only one hand card.");
        var prev_last_card = new Card(prev_player_cardInfo.pokeCards);
        // 下下家为友方
        if (curPlayer.role == prevPlayer.role) {
          // 找出与友方相同牌形的最小牌打出
          logger.info("Have right to play card. play the smaller card to let friend run.");
          firstCard = AIEngine.findSmallerThan(prev_last_card, cur_player_cardInfo).card;
        }
        else  // 下下家为敌方
        {
          // 打出手中牌值最大的牌
          firstCard = AIEngine.findDiffTypePlayCard(cur_player_cardInfo, prev_last_card);
          if (!firstCard) {
            logger.info("Have right to play card. play greater card to cover enemy's card.");
            firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, prev_last_card).card;
          }
          else {
            logger.info("Have right to play card. play the diff type card to cover enemy's card.");
          }
        }
      }

      // 下家手中有多于一手的牌 或面过程未找到有效牌
      // 手中只有最后两手牌
      if (firstCard == null && cur_player_cardInfo.cardPlans[0].hands == 2) {
        // 如最后两手为单 或 对，则先出牌值小的
        // 如最后两手牌为单或对 加 其它组合，则单 或对 最后出
        logger.info("Have right to play card. curPlayer only have two hands card.");
        firstCard = AIEngine.playLastTwoHandCard(cur_player_cardInfo, prev_player_cardInfo, next_player_cardInfo);

      }
      if (!firstCard && curPlayer.robot) {
        var otherRobot;
        if (prevPlayer.robot) {
          logger.info("Have right to play card. prevPlayer is another robotServer");
          otherRobot = prevPlayer;
        }
        else if (nextPlayer.robot) {
          logger.info("Have right to play card. nextPlayer is another robotServer");
          otherRobot = nextPlayer;
        }
        if (!!otherRobot){
          logger.info("Have right to play card. Two robots try to exchange cards");
          var cheatCondition1 = curPlayer.everGrabLard || (!curPlayer.everGrabLard && !otherRobot.everGrabLard);
          if (curPlayer.role == 2 || (curPlayer.role == 1 && otherRobot.role == 1 && cheatCondition1)){
            var exchangeResult = AIEngine.getBestCardInfo(curPlayer.pokeCards, otherRobot.pokeCards);
            var bestCardInfo = exchangeResult[0];
            var leftPokeCards = exchangeResult[1];
            if (bestCardInfo.cardPlans[0].hands <= cur_player_cardInfo.cardPlans[0].hands){
              cur_player_cardInfo = bestCardInfo;
              curPlayer.setPokeCards(bestCardInfo.pokeCards);
              otherRobot.setPokeCards(leftPokeCards);
              pokeGame.cheatCount = pokeGame.cheatCount + 1;
              logger.info("After exchange, curPlayer [%d] : hands=%d, role=%s", curPlayer.userId, cur_player_cardInfo.cardPlans[0].hands, curPlayer.role);
            }
          }
        }
      }
      if (firstCard == null)
      {
        logger.info("Have right to play card. curPlayer just play an any card.");
        firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
      }
    }
    else // 手中只有一手牌，则直接打出
    {
      logger.info("Have right to play card. curPlayer play the last card.");
      firstCard = AIEngine.findLordFirstCard(cur_player_cardInfo);
    }

  } else {
    // 无牌权
    // 手中有不止一手牌
    logger.info("No right to play card.");
    if (cur_player_cardInfo.cardPlans[0].hands > 1) {
      // 最后出牌者是友方
      if (lastPlayer.role == curPlayer.role) {
        // 友方剩最后一手牌 或者友方的最后所出牌牌值大于等于10 或者所出牌为三张以上
        if (last_player_cardInfo.cardPlans[0].hands == 1){
          logger.info("No right to play card. do not cover friend's card, let it run.");
        }
        else // 友方不手中不止一手牌，或所出牌牌权小于10
        {
          var tmpCardResult = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard);
          var tmpFirstCard = tmpCardResult.card;
          if (!!tmpFirstCard && ((tmpFirstCard.weight < 10 && !tmpCardResult.breakCard)  ||
              (cur_player_cardInfo.cardPlans[0].hands < last_player_cardInfo.cardPlans[0].hands) ||
              next_player_cardInfo.cardPlans[0].hands < 3)){
            firstCard = tmpFirstCard;
            logger.info("No right to play card. cover friend's card.");
          }
          else{
            logger.info("No right to play card. do not cover friend's card.");
          }
        }
      }
      else // 最后出牌者是敌方
      {
        logger.info("No right to play card. cover enemy's card.");
        firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;

        if (!firstCard && curPlayer.robot) {
          var otherRobot;
          if (prevPlayer.robot) {
            logger.info("No right to play card. prevPlayer is another robotServer");
            otherRobot = prevPlayer;
          }
          else if (nextPlayer.robot) {
            logger.info("No right to play card. nextPlayer is another robotServer");
            otherRobot = nextPlayer;
          }
          if (!!otherRobot){
            logger.info("No right to play card. Two robots exchange cards");
            var cheatCondition1 = curPlayer.everGrabLard || (!curPlayer.everGrabLard && !otherRobot.everGrabLard);
            if (curPlayer.role == 2 || (curPlayer.role == 1 && otherRobot.role == 1 && cheatCondition1)){
              var exchangeResult = AIEngine.getBestPowerCardInfo(curPlayer.pokeCards, otherRobot.pokeCards);
              var bestCardInfo = exchangeResult[0];
              var leftPokeCards = exchangeResult[1];
              if (bestCardInfo.cardPlans[0].hands <= cur_player_cardInfo.cardPlans[0].hands){
                cur_player_cardInfo = bestCardInfo;
                curPlayer.setPokeCards(bestCardInfo.pokeCards);
                otherRobot.setPokeCards(leftPokeCards);
                pokeGame.cheatCount = pokeGame.cheatCount + 1;
                logger.info("After exchange, curPlayer [%d] : hands=%d, role=%s", curPlayer.userId, cur_player_cardInfo.cardPlans[0].hands, curPlayer.role);
                firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
              }
            }
          }
        }
      }
    }
    else{
      logger.info("No right to play card. curPlayer play the last card.");
      firstCard = AIEngine.findLordPlayCard(cur_player_cardInfo, lastCard).card;
    }
  }

  return firstCard;
};

AIEngine.findFeasibleStraight = function (straights) {
  if (straights.length == 0)
    return null;

  var straight = straights[0];

  if (straights.length == 1)
    return straight;

  for (var index=1; index < straights.length; index ++) {
    if (straight.cardLength < straights[index].cardLength) {
      straight = straights[index];
    }
  }

  if ((straight.cardType == CardType.STRAIGHT && straight.cardLength > 5)
    || (straight.cardType == CardType.PAIRS_STRAIGHT && straight.cardLength > 3)
    || (straight.cardType == CardType.THREE_STRAIGHT && straight.cardLength > 2)) {
    return straight;
  }

  var straight = straights[0];
  for (var index=1; index < strights.length; index++ ) {
    if (straight.maxPokeValue < straights[index].maxPokeValue) {
      straight = straights[index];
    }
  }

  return straight;
};


AIEngine.findGreaterStraight = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];

  if (cardInfo.possibleStraights.length == 0)
    return null;

  var hasGreater = false;
  for (var index=0; index<cardInfo.possibleStraights.length; index++) {
    var s = cardInfo.possibleStraights[index];
    if (s.length > card.cardLength && s[s.length-1].value > card.maxPokeValue) {
      hasGreater = true;
      break;
    }
  }

  if (!hasGreater)
    return null;

  // 找刚好的单顺
  for (var cardIndex=0; cardIndex<plan.straightsCards.length; cardIndex++) {
    var otherCard = plan.straightsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return new CardResult(otherCard, null);
    }
  }

  // 拆同张数的双顺
  for (var cardIndex=0; cardIndex<plan.pairsStraightsCards.length; cardIndex++) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength == card.cardLength
      && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = [];
      for (var pokeIndex=0; pokeIndex<otherCard.cardLength; pokeIndex++) {
        pokes.push(otherCard.pokeCards[pokeIndex*2]);
      }
      return new CardResult(new Card(pokes), otherCard);
    }
  }

  // 拆最大单顺
  for (var cardIndex=plan.straightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.straightsCards[cardIndex];
    if (otherCard.cardLength > card.cardLength
      && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = otherCard.pokeCards.slice(0);
      for (var pokeIndex=card.cardLength-1; pokeIndex<pokes.length; pokeIndex++) {
        if (pokes[pokeIndex].value > card.maxPokeValue) {
          pokes = pokes.slice(pokeIndex-card.cardLength+1, pokeIndex+1);
          return new CardResult(new Card(pokes), otherCard);
        }
      }
    }
  }

  // 拆最大双顺
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength > card.cardLength
      && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = [];
      for (var index=0; index<otherCard.cardLength; index++){
        poke.push(otherCard.pokeCards[index*2]);
      }

      for (var pokeIndex=card.cardLength-1; pokeIndex<pokes.length; pokeIndex++) {
        if (pokes[pokeIndex].value > card.maxPokeValue) {
          pokes = pokes.slice(pokeIndex-card.cardLength+1, pokeIndex+1);
          return new CardResult(new Card(pokes), otherCard);
        }
      }
    }
  }

  for (var index=0; index<cardInfo.possibleStraights.length; index++) {
    var pokes = cardInfo.possibleStraights[index];
    if (pokes.length > card.cardLength && pokes[pokes.length-1].value > card.maxPokeValue) {
      for (var pokeIndex=card.cardLength-1; pokeIndex<pokes.length; pokeIndex++) {
        if (pokes[pokeIndex].value > card.maxPokeValue) {
          pokes = pokes.slice(pokeIndex-card.cardLength+1, pokeIndex+1);
          var rCard = new Card(pokes);
          var breakCards = [];
          for (var i=0; i<pokes.length; i++) {
            var bc = plan.getCardByPoke(pokes[i]);
            if (breakCards.indexOf(bc)<0)
              breakCards.push(bc);
          }
          return new CardResult(rCard, breakCards);
        }
      }
    }
  }

  return null;
};

AIEngine.findSmallerStraight = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];

  if (cardInfo.possibleStraights.length == 0)
    return null;

  var hasSmaller = false;
  for (var index=0; index<cardInfo.possibleStraights.length; index++) {
    var s = cardInfo.possibleStraights[index];
    if (s.length >= card.cardLength && s[0].value < card.minPokeValue) {
      hasSmaller = true;
      break;
    }
  }

  if (!hasSmaller)
    return null;

  // 找刚好的单顺
  for (var cardIndex=0; cardIndex<plan.straightsCards.length; cardIndex++) {
    var otherCard = plan.straightsCards[cardIndex];
    if (otherCard.pokeCards.length == card.pokeCards.length &&
        otherCard.minPokeValue < card.minPokeValue) {
      return new CardResult(otherCard, null);
    }
  }

  // 拆同张数的双顺
  for (var cardIndex=0; cardIndex<plan.pairsStraightsCards.length; cardIndex++) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength == card.cardLength
        && otherCard.minPokeValue < card.minPokeValue) {
      var pokes = [];
      for (var pokeIndex=0; pokeIndex<otherCard.cardLength; pokeIndex++) {
        pokes.push(otherCard.pokeCards[pokeIndex*2]);
      }
      return new CardResult(new Card(pokes), otherCard);
    }
  }

  // 拆最大单顺
  for (var cardIndex=plan.straightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.straightsCards[cardIndex];
    if (otherCard.cardLength > card.cardLength
        && otherCard.minPokeValue < card.minPokeValue) {
      var pokes = otherCard.pokeCards.slice(0);
      return new CardResult(new Card(pokes.slice(0, card.pokeCards.length)), otherCard);

    }
  }

  // 拆最大双顺
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength > card.cardLength
        && otherCard.minPokeValue < card.minPokeValue) {
      var pokes = [];
      for (var index=0; index<card.cardLength; index++){
        poke.push(otherCard.pokeCards[index*2]);
      }
      return new CardResult(new Card(pokes), otherCard);
      //for (var pokeIndex=card.cardLength-1; pokeIndex<pokes.length; pokeIndex++) {
      //  if (pokes[pokeIndex].value > card.maxPokeValue) {
      //    pokes = pokes.slice(pokeIndex-card.cardLength+1, pokeIndex+1);
      //    return new CardResult(new Card(pokes), otherCard);
      //  }
      //}
    }
  }

  for (var index=0; index<cardInfo.possibleStraights.length; index++) {
    var pokes = cardInfo.possibleStraights[index];
    if (pokes.length > card.cardLength && pokes[0].value < card.minPokeValue) {
      pokes = pokes.slice(0, card.cardLength);
      var rCard = new Card(pokes);
      var breakCards = [];
      for (var i=0; i<pokes.length; i++) {
        var bc = plan.getCardByPoke(pokes[i]);
        if (breakCards.indexOf(bc)<0)
          breakCards.push(bc);
      }
      return new CardResult(rCard, breakCards);
      //for (var pokeIndex=card.cardLength-1; pokeIndex<pokes.length; pokeIndex++) {
      //  if (pokes[pokeIndex].value > card.maxPokeValue) {
      //    pokes = pokes.slice(pokeIndex-card.cardLength+1, pokeIndex+1);
      //    var rCard = new Card(pokes);
      //    var breakCards = [];
      //    for (var i=0; i<pokes.length; i++) {
      //      var bc = plan.getCardByPoke(pokes[i]);
      //      if (breakCards.indexOf(bc)<0)
      //        breakCards.push(bc);
      //    }
      //    return new CardResult(rCard, breakCards);
      //  }
      //}
    }
  }

  return null;
};

AIEngine.findGreaterThree = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    // 找出大于的三张
    if (card.maxPokeValue >= otherCard.maxPokeValue)
      continue;

    // 牌型恰好为三张
    if (card.cardType == CardType.THREE) {
      return new CardResult(otherCard, null);
    }

    // 如果是三带二
    if (card.cardType == CardType.THREE_WITH_PAIRS) {
      // 有对子，直接用，这里暂时没有考虑对2的情况是否最优 (待改进)
      if (plan.pairsCards.length>0
        //&& plan.pairsCards[0].maxPokeValue != PokeCardValue.TWO
        ) {
        return new CardResult(new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards)), null);
      }

      // 没对子，尝试拆连对
      var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
      if (!!pairsStraight) {
        return new CardResult(new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0,2))), pairsStraight);
      }

      // 没对子、连对，拆小的三张
      if (cardIndex > 0) {
        return new CardResult(new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0,2))), plan.threesCards[0]);
      }

      // 拆三连
      var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
      if (!!threesStraight) {
        return new CardResult(new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0,2))), threesStraight);
      }
    }
    else if (card.cardType == CardType.THREE_WITH_ONE) {
      if (plan.singlesCards.length > 0) {
        return new CardResult(new Card(otherCard.pokeCards.concat(plan.singlesCards[0].pokeCards.slice(0,1))), null);
      }

      if (plan.pairsCards.length > 0) {
        return new CardResult(new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards.slice(0,1))), null);
      }

      if (cardIndex > 0) {
        return new CardResult(new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0,1))), plan.threesCards[0]);
      }

      var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
      if (!!threesStraight) {
        return new CardResult(new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0,1))), threesStraight);
      }

      var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
      if (!!pairsStraight) {
        return new CardResult(new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0,1))), pairsStraight);
      }
    }
  }

  return null;
};

AIEngine.findSmallerThree = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  var otherCard;
  if (plan.threesCards.length > 0 && plan.threesCards[0].maxPokeValue < card.maxPokeValue){
    otherCard = plan.threesCards[0];
  }
  else if (plan.bombsCards.length > 0 && plan.bombsCards[0].maxPokeValue < card.maxPokeValue){
    otherCard = new Card(plan.bombsCards[0].pokeCards.slice(0,3));
  }
  if (!otherCard){
    return null;
  }
  // 牌型恰好为三张
  if (card.cardType == CardType.THREE) {
    return new CardResult(otherCard, null);
  }

  // 如果是三带二
  if (card.cardType == CardType.THREE_WITH_PAIRS) {
    // 有对子，直接用，这里暂时没有考虑对2的情况是否最优 (待改进)
    if (plan.pairsCards.length>0
    //&& plan.pairsCards[0].maxPokeValue != PokeCardValue.TWO
    ) {
      return new CardResult(new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards)), null);
    }

    // 没对子，尝试拆连对
    var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
    if (!!pairsStraight) {
      return new CardResult(new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0,2))), pairsStraight);
    }

    // 没对子、连对，拆小的三张
    if (cardIndex > 0) {
      return new CardResult(new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0,2))), plan.threesCards[0]);
    }

    // 拆三连
    var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
    if (!!threesStraight) {
      return new CardResult(new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0,2))), threesStraight);
    }
  }
  else if (card.cardType == CardType.THREE_WITH_ONE) {
    if (plan.singlesCards.length > 0) {
      return new CardResult(new Card(otherCard.pokeCards.concat(plan.singlesCards[0].pokeCards.slice(0,1))), null);
    }

    if (plan.pairsCards.length > 0) {
      return new CardResult(new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards.slice(0,1))), null);
    }

    if (cardIndex > 0) {
      return new CardResult(new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0,1))), plan.threesCards[0]);
    }

    var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
    if (!!threesStraight) {
      return new CardResult(new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0,1))), threesStraight);
    }

    var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
    if (!!pairsStraight) {
      return new CardResult(new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0,1))), pairsStraight);
    }
  }
  return null;
};

AIEngine.findSmallerThreeWithBreakBestPlan = function(card, cardInfo) {
  logger.info("AIEngine.findSmallerThreeWithBreakBestPlan");
  var otherCard;
  var threeGroups = CardInfo.getPossibleThrees(cardInfo.groups);
  logger.info("AIEngine.findSmallerThreeWithBreakBestPlan, threeGroups.length=%d", threeGroups.length);
  if (threeGroups.length > 0 && threeGroups.get(0).pokeValue < card.maxPokeValue)
    otherCard = threeGroups.get(0);
  else
    return null;

  // 牌型恰好为三张
  if (card.cardType == CardType.THREE) {
    return new CardResult(new Card(otherCard.pokeCards), null);
  }

  var leftPokeGroups = CardInfo.getPokeGroupsExcludeUsedPokes(cardInfo.pokeCards, threeGroups)
    // 如果是三带二
  if (card.cardType == CardType.THREE_WITH_PAIRS) {

    var pairGroups = CardInfo.getPossiblePairs(leftPokeGroups);
    // 有对子，直接用，这里暂时没有考虑对2的情况是否最优 (待改进)
    if (pairGroups.length>0
    //&& plan.pairsCards[0].maxPokeValue != PokeCardValue.TWO
    ) {
      return new CardResult(new Card(otherCard.pokeCards.concat(pairGroups.get(0).pokeCards)), null);
    }

  }
  else if (card.cardType == CardType.THREE_WITH_ONE) {
    var singleGroups = CardInfo.getPossibleSingles(leftPokeGroups);
    if (singleGroups.length > 0) {
      return new CardResult(new Card(otherCard.pokeCards.concat(singleGroups.get(0).pokeCards.slice(0,1))), null);
    }
  }
  return null;
};

AIEngine.findGreaterThreesStraight = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  var optionCard = null;
  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return new CardResult(otherCard, null);
    }

    if (!optionCard
      && otherCard.maxPokeValue > card.maxPokeValue
      && otherCard.cardLength > card.cardLength) {
      optionCard = otherCard;
    }
  }

  if (!!optionCard) {
    return new CardResult(new Card(optionCard.pokeCards.slice(0, card.pokeCards.length)), optionCard);
  }

  return null;
};

AIEngine.findSmallerThreesStraight = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  var optionCard = null;
  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (otherCard.pokeCards.length == card.pokeCards.length &&
        otherCard.maxPokeValue < card.maxPokeValue) {
      return new CardResult(otherCard, null);
    }

    if (!optionCard
        && otherCard.minPokeValue < card.minPokeValue
        && otherCard.cardLength > card.cardLength) {
      optionCard = otherCard;
    }
  }

  if (!!optionCard) {
    return new CardResult(new Card(optionCard.pokeCards.slice(0, card.pokeCards.length)), optionCard);
  }

  return null;
};

AIEngine.findGreaterPairsStraight = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  var optionCard = null;
  for (var cardIndex=0; cardIndex<plan.pairsStraightsCards.length; cardIndex++ ) {
    var otherCard = plan.pairsStraightsCards[cardIndex];

    if (cardUtil.compare(otherCard, card)) {
      return new CardResult(otherCard, null);
    }

    if (!optionCard
      && otherCard.maxPokeValue > card.maxPokeValue
      && otherCard.cardLength > card.cardLength ) {
      optionCard = otherCard;
    }
  }

  if (!!optionCard) {
    return new CardResult(new Card(optionCard.pokeCards.slice(0, card.pokeCards.length)), optionCard);
  }

  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (otherCard.cardLength >= card.cardLength && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = [];
      for (var index=0; index<card.cardLength; index++) {
        pokes.push(otherCard.pokeCards[index*3]);
        pokes.push(otherCard.pokeCards[index*3+1]);
      }
      return new CardResult(new Card(pokes), otherCard);
    }
  }

  return null;
};

AIEngine.findSmallerPairsStraight = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  var optionCard = null;
  for (var cardIndex=0; cardIndex<plan.pairsStraightsCards.length; cardIndex++ ) {
    var otherCard = plan.pairsStraightsCards[cardIndex];

    if (otherCard.pokeCards.length == card.pokeCards.length &&
        otherCard.maxPokeValue < card.maxPokeValue ) {
      return new CardResult(otherCard, null);
    }

    if (!optionCard
        && otherCard.minPokeValue < card.minPokeValue
        && otherCard.cardLength > card.cardLength ) {
      optionCard = otherCard;
    }
  }

  if (!!optionCard) {
    return new CardResult(new Card(optionCard.pokeCards.slice(0, card.pokeCards.length)), optionCard);
  }

  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (otherCard.cardLength >= card.cardLength && otherCard.minPokeValue < card.minPokeValue) {
      var pokes = [];
      for (var index=0; index<card.cardLength; index++) {
        pokes.push(otherCard.pokeCards[index*3]);
        pokes.push(otherCard.pokeCards[index*3+1]);
      }
      return new CardResult(new Card(pokes), otherCard);
    }
  }

  return null;
};

/**
 * 找出比card大的可能对子
 * @param card
 * @param cardInfo
 * @returns {*}
 */
AIEngine.findGreaterPairs = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  // 先在对子里找最小对子
  for (var cardIndex=0; cardIndex<plan.pairsCards.length; cardIndex++) {
    var otherCard = plan.pairsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return new CardResult(otherCard, null);
    }
  }

  // 拆三对以上的双顺的最大对子
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength >3 && otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(-2) ), otherCard);
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(-2) ), otherCard);
    }
  }

  // 拆双顺
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(-2) ), otherCard);
    }
  }

  // 拆双顺
  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (otherCard.minPokeValue > card.maxPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(0, 2) ), otherCard);
    }
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(-2) ), otherCard);
    }
  }

  for (var groupIndex=0; groupIndex<cardInfo.pairs.length; groupIndex++) {
    var group = cardInfo.pairs.get(groupIndex);
    if (group.pokeValue > card.maxPokeValue) {
      var rCard = new Card( group.pokeCards);
      var breakCards = [plan.getCardByPoke(group.pokeCards[0]), plan.getCardByPoke(group.pokeCards[1])];
      return new CardResult(rCard, breakCards);
    }
  }

  for (var groupIndex=0; groupIndex<cardInfo.threes.length; groupIndex++) {
    var group = cardInfo.threes.get(groupIndex);
    if (group.pokeValue > card.maxPokeValue) {
      var rCard = new Card( group.pokeCards);
      var breakCards = [plan.getCardByPoke(group.pokeCards[0]),
        plan.getCardByPoke(group.pokeCards[1]),
        plan.getCardByPoke(group.pokeCards[2])];
      return new CardResult(rCard, breakCards);
    }
  }

  return null;
};

AIEngine.findSmallerPairsWithBreakBestPlan = function(card, cardInfo) {
  var parisGroups = CardInfo.getPossiblePairs(cardInfo.groups);
  logger.info("AIEngine.findSmallerPairsWithBreakBestPlan");
  if (parisGroups.length > 0 && parisGroups.get(0).pokeValue < card.maxPokeValue)
      return new CardResult(new Card( parisGroups.get(0).pokeCards.slice(0, 2) ), null);

  return null;
};

AIEngine.findSmallerPairs = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  // 先在对子里找最小对子
  for (var cardIndex=0; cardIndex<plan.pairsCards.length; cardIndex++) {
    var otherCard = plan.pairsCards[cardIndex];
    if (otherCard.pokeCards.maxPokeValue < card.pokeCards.maxPokeValue) {
      return new CardResult(otherCard, null);
    }
  }

  // 拆三对以上的双顺的最大对子
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength >3 && otherCard.minPokeValue < card.minPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(0, 2) ), otherCard);
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    if (otherCard.maxPokeValue < card.maxPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(0, 2) ), otherCard);
    }
  }

  // 拆双顺
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.minPokeValue < card.minPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(0, 2) ), otherCard);
    }
  }

  // 拆三顺
  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (otherCard.minPokeValue < card.minPokeValue) {
      return new CardResult(new Card( otherCard.pokeCards.slice(0, 2) ), otherCard);
    }
  }

  for (var groupIndex=0; groupIndex<cardInfo.pairs.length; groupIndex++) {
    var group = cardInfo.pairs.get(groupIndex);
    if (group.pokeValue < card.maxPokeValue) {
      var rCard = new Card( group.pokeCards);
      var breakCards = [plan.getCardByPoke(group.pokeCards[0]), plan.getCardByPoke(group.pokeCards[1])];
      return new CardResult(rCard, breakCards);
    }
  }

  for (var groupIndex=0; groupIndex<cardInfo.threes.length; groupIndex++) {
    var group = cardInfo.threes.get(groupIndex);
    if (group.pokeValue < card.maxPokeValue) {
      var rCard = new Card( group.pokeCards);
      var breakCards = [plan.getCardByPoke(group.pokeCards[0]),
        plan.getCardByPoke(group.pokeCards[1]),
        plan.getCardByPoke(group.pokeCards[2])];
      return new CardResult(rCard, breakCards);
    }
  }

  return null;
};

AIEngine.findGreaterSingle = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  // 找最小单牌
  for (var cardIndex=0; cardIndex<plan.singlesCards.length; cardIndex++) {
    var otherCard = plan.singlesCards[cardIndex];
    if (otherCard.maxPokeValue > PokeCardValue.TWO) {
      var s = 5;
      s ++;
    }

    if (cardUtil.compare(otherCard, card)) {
      return new CardResult(otherCard, null);
    }
  }

  // 拆二
  var group = cardInfo.groups.getGroupByPokeValue(PokeCardValue.TWO);
  if (!!group) {
    var otherCard = new Card(group.pokeCards.slice(0,1));
    if (cardUtil.compare(otherCard, card)) {
      return new CardResult(new Card(group.pokeCards.slice(0, 1)), plan.getCardByPoke(group.pokeCards[0]));
    }
  }

  // 拆对牌
  for (var cardIndex=0; cardIndex<plan.pairsCards.length; cardIndex++) {
    var otherCard = plan.pairsCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card(otherCard.pokeCards.slice(0, 1)), otherCard);
    }
  }

  // 拆6张以上的单顺的顶张
  for (var cardIndex=0; cardIndex<plan.straightsCards.length; cardIndex++) {
    var otherCard = plan.straightsCards[cardIndex];
    if (otherCard.cardLength > 5 && otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card(otherCard.pokeCards.slice(-1)), otherCard);
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card(otherCard.pokeCards.slice(0, 1)), otherCard);
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return new CardResult(new Card(otherCard.pokeCards.slice(0, 1)), otherCard);
    }
  }

  for (var groupIndex=0; groupIndex<cardInfo.groups.length; groupIndex++) {
    var group = cardInfo.groups.get(groupIndex);
    if (group.pokeCards.length == 4)
      continue;

    if (group.pokeCards.length == 2
      && group.pokeCards[0].value == PokeCardValue.SMALL_JOKER) {
      continue;
    }

    if (group.pokeCards[0].value > PokeCardValue.TWO) {
      // for break point
      var s2 = 0;
      s2++;
    }

    if (group.pokeValue > card.maxPokeValue) {
      return new CardResult(new Card(group.pokeCards.slice(0,1)), plan.getCardByPoke(group.pokeCards[0]));
    }
  }

  return null;
};

AIEngine.findSmallerSingleWithBreakBestPlan = function (card, cardInfo) {
  var singleGroups = CardInfo.getPossibleSingles(cardInfo.groups);
  if (singleGroups.length > 0 && singleGroups.get(0).pokeValue < card.maxPokeValue)
    return new CardResult(new Card( singleGroups.get(0).slice(0) ), null);

  return null;
};


AIEngine.findSmallerSingle = function(card, cardInfo) {
  logger.info("AIEngine.findSmallerSingle");
  var plan = cardInfo.cardPlans[0];
  // 找最小单牌
  for (var cardIndex=0; cardIndex<plan.singlesCards.length; cardIndex++) {
    var otherCard = plan.singlesCards[cardIndex];
    if (otherCard.maxPokeValue > PokeCardValue.TWO) {
      var s = 5;
      s ++;
    }

    if (otherCard.maxPokeValue < card.maxPokeValue) {
      logger.info("AIEngine.findSmallerSingle, 1");
      return new CardResult(new Card(otherCard.pokeCards.slice(0)), null);
    }
  }

  // 拆二
  var group = cardInfo.groups.getGroupByPokeValue(PokeCardValue.TWO);
  if (!!group) {
    var otherCard = new Card(group.pokeCards.slice(0,1));
    if (otherCard.maxPokeValue < card.maxPokeValue) {
      logger.info("AIEngine.findSmallerSingle, 2");
      return new CardResult(new Card(group.pokeCards.slice(0, 1)), plan.getCardByPoke(group.pokeCards[0]));
    }
  }

  // 拆对牌
  for (var cardIndex=0; cardIndex<plan.pairsCards.length; cardIndex++) {
    var otherCard = plan.pairsCards[cardIndex];
    if (otherCard.maxPokeValue < card.maxPokeValue) {
      logger.info("AIEngine.findSmallerSingle, 3");
      return new CardResult(new Card(otherCard.pokeCards.slice(0, 1)), otherCard);
    }
  }

  // 拆6张以上的单顺的底张
  for (var cardIndex=0; cardIndex<plan.straightsCards.length; cardIndex++) {
    var otherCard = plan.straightsCards[cardIndex];
    if (otherCard.cardLength > 5 && otherCard.minPokeValue < card.minPokeValue) {
      logger.info("AIEngine.findSmallerSingle, 4");
      return new CardResult(new Card(otherCard.pokeCards.slice(0, 1)), otherCard);
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    if (otherCard.maxPokeValue < card.maxPokeValue) {
      logger.info("AIEngine.findSmallerSingle, 5");
      return new CardResult(new Card(otherCard.pokeCards.slice(0, 1)), otherCard);
    }
  }

  for (var groupIndex=0; groupIndex<cardInfo.groups.length; groupIndex++) {
    var group = cardInfo.groups.get(groupIndex);
    if (group.pokeCards.length == 4)
      continue;

    if (group.pokeCards.length == 2
        && group.pokeCards[0].value == PokeCardValue.SMALL_JOKER) {
      continue;
    }

    if (group.pokeCards[0].value > PokeCardValue.TWO) {
      // for break point
      var s2 = 0;
      s2++;
    }

    if (group.pokeValue < card.maxPokeValue) {
      logger.info("AIEngine.findSmallerSingle, 6");
      return new CardResult(new Card(group.pokeCards.slice(0,1)), plan.getCardByPoke(group.pokeCards[0]));
    }
  }

  return null;
};

AIEngine.findGreaterBomb = function(card, cardInfo) {
  var plan = cardInfo.cardPlans[0];
  for (var cardIndex=0; cardIndex<plan.bombsCards.length; cardIndex++) {
    var otherCard = plan.bombsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return new CardResult(otherCard, null);
    }
  }

  return null;
};

AIEngine.findGreaterThan = function(card, cardInfo) {
  var result = null;
  var plan = cardInfo.cardPlans[0];

  var minBombCard = null;
  var rocketCard = null;
  if (plan.bombsCards.length>0) {
    minBombCard = plan.bombsCards[0];
  }
  if (plan.rocketsCards.length>0) {
    rocketCard = plan.rocketsCards[0];
  }

  switch (card.cardType) {
    case CardType.BOMB:
    case CardType.FOUR_WITH_TWO_PAIRS:
      result = AIEngine.findGreaterBomb(card, cardInfo);
      if(!!result)
        break;

      if (!!rocketCard) {
        result = new CardResult(rocketCard, null);
      }
      break;

    case CardType.THREE_STRAIGHT:
      result = AIEngine.findGreaterThreesStraight(card, cardInfo);
      break;

    case CardType.THREE:
    case CardType.THREE_WITH_ONE:
    case CardType.THREE_WITH_PAIRS:
      result = AIEngine.findGreaterThree(card, cardInfo);
      break;

    case CardType.PAIRS_STRAIGHT:
      result = AIEngine.findGreaterPairsStraight(card, cardInfo);
      break;

    case CardType.PAIRS:
      result = AIEngine.findGreaterPairs(card, cardInfo);
      break;

    case CardType.STRAIGHT:
      result = AIEngine.findGreaterStraight(card, cardInfo);
      break;

    case CardType.SINGLE:
      result = AIEngine.findGreaterSingle(card, cardInfo);
      break;
  }

  return result;
};

AIEngine.findSmallerThan = function(card, cardInfo) {
  logger.info("AIEngine.findSmallerThan");
  var result = null;
  var plan = cardInfo.cardPlans[0];

  switch (card.cardType) {
    //case CardType.FOUR_WITH_TWO_PAIRS:
    //  result = AIEngine.findGreaterBomb(card, cardInfo);
    //  if(!!result)
    //    break;
    //
    //  if (!!rocketCard) {
    //    result = new CardResult(rocketCard, null);
    //  }
    //  break;

    case CardType.THREE_STRAIGHT:
      result = AIEngine.findSmallerThreesStraight(card, cardInfo);
      break;

    case CardType.THREE:
    case CardType.THREE_WITH_ONE:
    case CardType.THREE_WITH_PAIRS:
      result = AIEngine.findSmallerThree(card, cardInfo);
        if (!result) {
          result = AIEngine.findSmallerThreeWithBreakBestPlan(card, cardInfo);
        }
      break;

    case CardType.PAIRS_STRAIGHT:
      result = AIEngine.findSmallerPairsStraight(card, cardInfo);
      break;

    case CardType.PAIRS:
      result = AIEngine.findSmallerPairs(card, cardInfo);
      if (!result) {
        result = AIEngine.findSmallerPairsWithBreakBestPlan(card, cardInfo);
      }
      break;

    case CardType.STRAIGHT:
      result = AIEngine.findSmallerStraight(card, cardInfo);
      break;

    case CardType.BOMB:
    case CardType.SINGLE:
      logger.info("AIEngine.findSmallerThan, CardType.SINGLE");
      result = AIEngine.findSmallerSingle(card, cardInfo);
      if (!result) {
        result = AIEngine.findSmallerSingleWithBreakBestPlan(card, cardInfo);
      }
      break;
  }
  if (!result)
    return new CardResult(null, null);
  return result;
};

AIEngine.playLastTwoHandCard = function(cur_player_card_info, enemy_player_card_info) {
  var lordPlan = cur_player_card_info.cardPlans[0];
  if (lordPlan.rocketsCards.length>0) {
    return new Card(cur_player_card_info.pokeCards.slice(0).exclude(lordPlan.rocketsCards[0].pokeCards));
  }

  // 有炸弹，则先出非炸弹的牌
  if (lordPlan.bombsCards.length>0) {
    return new Card(cur_player_card_info.pokeCards.slice(0).exclude(lordPlan.bombsCards[0].pokeCards));
  }

  if (lordPlan.allCards.length == 2) {
    var card1 = lordPlan.allCards[0];
    var card2 = lordPlan.allCards[1];

    cardResult = AIEngine.findGreaterThan(card1, enemy_player_card_info);
    if (cardResult == null) {
      return card1;
    }

    cardResult = AIEngine.findGreaterThan(card2, enemy_player_card_info);
    if (cardResult == null) {
      return card2;
    }

    if (card1.maxPokeValue > card2.maxPokeValue) {
      return card1;
    }

    return card2;
  }
};

AIEngine.findLordFirstCard = function(lordCardInfo) {
  var lordPlan = lordCardInfo.cardPlans[0];

  // 只剩一手牌，直接出
  if (lordPlan.hands == 1) {
    return new Card(lordCardInfo.pokeCards);
  }

  if (lordPlan.straightsCards.length > 0) {
    if (lordPlan.straightsCards[0].maxPokeValue < PokeCardValue.QUEEN) {
      return lordPlan.straightsCards[0];
    }
  }

  if (lordPlan.threesCards.length > 0) {
    if (lordPlan.threesCards[0].maxPokeValue < PokeCardValue.JACK) {
      if (lordPlan.singlesCards.length>0 && lordPlan.singlesCards[0].maxPokeValue < PokeCardValue.TWO) {
        return new Card(lordPlan.threesCards[0].pokeCards.concat(lordPlan.singlesCards[0].pokeCards));
      }

      if (lordPlan.pairsCards.length>0 && lordPlan.pairsCards[0].maxPokeValue < PokeCardValue.ACE) {
        return new Card(lordPlan.threesCards[0].pokeCards.concat(lordPlan.pairsCards[0].pokeCards));
      }
    }
  }

  if (lordPlan.threesStraightsCards.length > 0) {
    if ((lordPlan.threesStraightsCards[0].maxPokeValue < PokeCardValue.JACK)
      || (lordPlan.hands<4)) {
      var cardLength = lordPlan.threesStraightsCards[0].cardLength;
      if (lordPlan.singlesCards.length >= cardLength) {
        if (lordPlan.singlesCards[cardLength - 1].maxPokeValue < PokeCardValue.TWO) {
          var pokes = lordPlan.singlesCards.slice(0, cardLength).map(function(card) { return card.pokeCards[0];});
          return new Card(lordPlan.threesStraightsCards[0].pokeCards.concat(pokes));
        }
      }

      if (lordPlan.pairsCards.length >= cardLength) {
        if (lordPlan.pairsCards[cardLength - 1].maxPokeValue < PokeCardValue.TWO) {
          var pokes = [];
          lordPlan.pairsCards.slice(0, cardLength).reduce(function(p, card) { return p.append(card.pokeCards);}, pokes);
          //lordPlan.pairsCards.slice(0, cardLength).reduce(function(p, card) { return appendArray(p, card.pokeCards);}, pokes);
          return new Card(lordPlan.threesStraightsCards[0].pokeCards.concat(pokes));
        }
      }

      return lordPlan.threesStraightsCards[0];
    }
  }

  // 单张>4, 先出单张
  if (lordPlan.singlesCards.length > 2) {
    return lordPlan.singlesCards[0];
  }

  // 对子多，且比单张小，出对子
  if (lordPlan.pairsCards.length > 2) {
    if (lordPlan.singlesCards.length > 0 && lordPlan.singlesCards[0].maxPokeValue > lordPlan.pairsCards[0].maxPokeValue) {
      return lordPlan.pairsCards[0];
    }
  }

  // 出连对
  if (lordPlan.pairsStraightsCards.length > 0 && lordPlan.pairsStraightsCards[0].maxPokeValue < PokeCardValue.ACE) {
    return lordPlan.pairsStraightsCards[0];
  }

  // 出单顺
  if (lordPlan.straightsCards.length > 0) {
    return lordPlan.straightsCards[0];
  }

  // 出三带
  if (lordPlan.threesCards.length >0 && lordPlan.threesCards[0].maxPokeValue < PokeCardValue.TWO) {
    if (lordPlan.singlesCards.length >0 && lordPlan.pairsCards.length >0) {
      if (lordPlan.singlesCards[0].maxPokeValue < lordPlan.pairsCards[0].maxPokeValue) {
        return new Card(lordPlan.threesCards[0].pokeCards.slice(0).concat(lordPlan.singlesCards[0].pokeCards));
      }

      return new Card(lordPlan.threesCards[0].pokeCards.slice(0).concat(lordPlan.pairsCards[0].pokeCards));
    } else if (lordPlan.singlesCards.length > 0) {
      return new Card(lordPlan.threesCards[0].pokeCards.slice(0).concat(lordPlan.singlesCards[0].pokeCards));
    } else if (lordPlan.pairsCards.length > 0) {
      return new Card(lordPlan.threesCards[0].pokeCards.slice(0).concat(lordPlan.pairsCards[0].pokeCards));
    }

    return lordPlan.threesCards[0];
  }

  return lordPlan.allCards[0];
};

AIEngine.findLordPlayCard = function(lordCardInfo, lastCard) {
  var cardResult = AIEngine.findGreaterThan(lastCard, lordCardInfo);
  if (!cardResult) {
    var plan = lordCardInfo.cardPlans[0]
    if (plan.bombsCards.length > 0 && cardUtil.compare(plan.bombsCards[0], lastCard)) {
      return new CardResult(plan.bombsCards[0], null);
    }
    if (plan.rocketsCards.length >0) {
      return new CardResult(plan.rocketsCards[0], null);
    }
    return new CardResult(null, null);
  }

  if (!!cardResult.breakCard) {
    var pokeCards = lordCardInfo.pokeCards.slice(0).exclude(cardResult.card.pokeCards);
    //var pokeCards = excludeArray(lordCardInfo.pokeCards.slice(0), cardResult.card.pokeCards);
    var newCardInfo = CardInfo.create(pokeCards);
    CardAnalyzer.analyze(newCardInfo);
    if (newCardInfo.cardPlans[0].hands > lordCardInfo.cardPlans[0].hands + 1) {
      return new CardResult(null, null);
    }

    return cardResult;
  }

  return cardResult;
};

AIEngine.findDiffTypePlayCard = function (lordCardInfo, lastCard) {
  var lordPlan = lordCardInfo.cardPlans[0];
  if (lordPlan.straightsCards.length > 0 && lastCard.cardType != CardType.STRAIGHT ) {
    return new Card(lordPlan.straightsCards[0].pokeCards.slice(0));
  }
  if (lordPlan.threesStraightsCards.length > 0 && lastCard.cardType != CardType.THREE_STRAIGHT) {
    return new Card(lordPlan.threesStraightsCards[0].pokeCards.slice(0));
  }
  if (lordPlan.pairsStraightsCards.length > 0 && lastCard.cardType != CardType.PAIRS_STRAIGHT) {
    return new Card(lordPlan.pairsStraightsCards[0].pokeCards.slice(0));
  }
  if (lordPlan.threesCards.length > 0 && lastCard.cardType != CardType.THREE) {
    return new Card(lordPlan.threesCards[0].pokeCards.slice(0));
  }
  if (lordPlan.pairsCards.length > 0 && lastCard.cardType != CardType.PAIRS) {
    return new Card(lordPlan.pairsCards[0].pokeCards.slice(0));
  }
  if (lordPlan.singlesCards.length > 0 && lastCard.cardType != CardType.SINGLE) {
    return new Card(lordPlan.singlesCards[0].pokeCards.slice(0));
  }
  return null;
};



module.exports = AIEngine;