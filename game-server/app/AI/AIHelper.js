var Card = require('../domain/card');

var AIHelper = function() {
};

AIHelper.sortAscBy = function(field) {
  return function(a, b) {
    return a[field] - b[field];
  };
};

AIHelper.sortDescBy = function(field) {
  return function (a, b) {
    return a[field] - b[field];
  };
};

AIHelper.copyGroups = function(srcGroups, dstGroups) {
  for (var index=0; index<srcGroups.length; index++) {
    dstGroups.push(srcGroups[index].slice(0));
  }
};


AIHelper.groupsToCards = function(groups) {
  var cards = [];
  for (var index=0; index<groups.data.length; index++) {
    cards.push(new Card(groups.data[index].pokeCards));
  }

  return cards;
};


AIHelper.groupsToString = function( groups ) {
  return groups.data.map( function(group) {
    return group.pokeCards.map(function(p) { return p.valueChar; }).join('');
  }).join(", ");
};

AIHelper.cardsToString = function( cards ) {

  if (cards == null)
    return "";

  return cards.map( function(card) {
    return card.pokeCards.map(function(p) { return p.valueChar; }).join('');
  }).join(", ");
};

module.exports = AIHelper;
