var CardResult = function(card, breakCard) {
  this.card = card;
  this.breakCard = breakCard;
};

CardResult.prototype.dump = function() {
  var result = "";
  if (!!this.card) {
    result = this.card.getPokeValueChars();
  }

  if (!!this.breakCard) {
    var breakCardChars = "";
    if (this.breakCard instanceof Array) {
      breakCardChars = this.breakCard.map(function(card){return card.getPokeValueChars();}).join(', ');
    } else {
      breakCardChars = this.breakCard.getPokeValueChars();
    }
    result = result + " breaks [" + breakCardChars + "]";
  }

  return result;
};

module.exports = CardResult;