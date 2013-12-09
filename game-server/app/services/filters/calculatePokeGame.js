/**
 * Created by edward on 13-12-9.
 */


var CalculatePokeGameFilter = function(opts) {

};

module.exports = CalculatePokeGameFilter;

CalculatePokeGameFilter.execute = function (params, cb) {
  var table = params.table;
  var pokeGame = table.pokeGame;

  var score = pokeGame.score;

  // 输赢总数 = ante x lordValue x (2 ^ doubles) x (2 ^ bombs) x (4 ^ rockets) x (2 ^ abs(spring))
  score.total = score.ante * score.lordValue;
  score.total = score.total * Math.pow(2, score.redoubles);
  score.total = score.total * Math.pow(2, score.bombs);
  score.total = score.total * Math.pow(4, score.rockets);
  score.total = score.total * Math.pow(2, Math.abs(score.spring));

  if (score.rake == 0) {
    score.raked_total = score.total;
  } else if (score.rake < 1) {
    score.raked_total = score.total * (1 - score.rake);
  } else {
    score.raked_total = score.total - score.rake;
  }
};