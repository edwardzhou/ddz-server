/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

//var PokeGroup = require('./PokeGroup');
var AIHelper = require('./AIHelper');

var PokeGroupArray = function() {
  this.data = [];
};

PokeGroupArray.prototype.sort = function() {
  this.data.sort(function(a,b) { return a.get(0).value - b.get(0).value; });
  return this;
};

PokeGroupArray.prototype.add = function(pokeGroup) {
  this.data.push(pokeGroup);
  return this;
};

PokeGroupArray.prototype.push = function(pokeGroup) {
  return this.add(pokeGroup);
};

PokeGroupArray.prototype.remove = function(pokeGroup) {
  var index = this.findIndex(pokeGroup);
  if (index < 0)
    return null;

  var group = this.data.splice(index, 1);
  return group;
};

PokeGroupArray.prototype.findIndex = function(pokeGroup) {
  for (var index=0; index<this.data.length; index++) {
    if (this.data[index].equals(pokeGroup)) {
      return index;
    }
  }

  return -1;
};


PokeGroupArray.prototype.findIndexByPokeValue = function(pokeValue) {
  for (var index=0; index< this.data.length; index++) {
    if (this.data[index].pokeValue == pokeValue)
      return index;
  }

  return -1;
};

PokeGroupArray.prototype.getGroupByPokeValue = function(pokeValue) {
  var index = this.findIndexByPokeValue(pokeValue);
  if (index < 0)
    return null;

  return this.data[index];
};

PokeGroupArray.prototype.get = function(index) {
  return this.data[index];
};

Object.defineProperty(PokeGroupArray.prototype, 'length', {
  enumerable: false,
  get: function() { return this.data.length }
});


PokeGroupArray.prototype.clone = function() {
  var newGroupArray = new PokeGroupArray();
  for (var index=0; index<this.data.length; index++) {
    newGroupArray.data.push(this.data[index].clone());
  }
  return newGroupArray;
};

PokeGroupArray.prototype.getPokecards = function() {
  var pokecards = [];
  for (var groupIndex=0; groupIndex<this.data.length; groupIndex++){
    for (var pokeIndex=0; pokeIndex<this.data[groupIndex].pokeCards.length; pokeIndex++) {
      pokecards.push(this.get(groupIndex).get(pokeIndex));
    }
  }

  pokecards.sort(AIHelper.sortAscBy('index'));
  return pokecards;
};

PokeGroupArray.prototype.removeGroups = function(groups) {
  var removedGroups = [];
  for (var index=0; index<groups.length; index++) {
    var g = groups.get(index);
    var groupIndex = this.findIndex(g);
    if (groupIndex > -1) {
      this.data.splice(groupIndex, 1);
    }

    if (!!g)
      removedGroups.push(g);
  }

  return removedGroups;
};

PokeGroupArray.prototype.removePokeCard = function(poke) {
  var index = this.findIndexByPokeValue(poke.value);
  if (index<0) {
    return null;
  }

  var group = this.data[index];
  group.remove(poke);
  if (group.pokeCount ==0 ) {
    this.data.splice(index, 1);
  }
  return group;
};


PokeGroupArray.prototype.removePokeCards = function(pokes) {
  for (var index=0; index<pokes.length; index++) {
    this.removePokeCard(pokes[index]);
  }
};

module.exports = PokeGroupArray;