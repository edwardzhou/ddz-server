/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var PokeGroup = function(pokes) {
  this.pokeCards = pokes.slice(0);
  this.pokeValue = this.pokeCards[0].value;
  this.pokeValueChar = this.pokeCards[0].valueChar;
  this.pokeCount = this.pokeCards.length;
};

PokeGroup.prototype.get = function(index) {
  return this.pokeCards[index];
};

PokeGroup.prototype.slice = function(index, length) {
  return this.pokeCards.slice(index, length);
};

PokeGroup.prototype.slice = function(index) {
  return this.pokeCards.slice(index);
};

PokeGroup.prototype.push = function(poke) {
  this.pokeCards.push(poke);
  this.pokeCount = this.pokeCards.length;
  return this;
};

PokeGroup.prototype.shift = function() {
  if (this.pokeCards.length <= 0) {
    return null;
  }

  var poke = this.pokeCards.shift();
  this.pokeCount --;
  if (this.pokeCount <=0) {
    this.pokeValue = 0; // None
  }

  return poke;
};

PokeGroup.prototype.remove = function(poke) {
  var index = this.pokeCards.indexOf(poke);
  if (index >=0) {
    this.pokeCards.splice(index, 1);
    this.pokeCount = this.pokeCards.length;
    if (this.pokeCount <=0) {
      this.pokeValue = 0;
      this.pokeValueChar = '';
    }
    return poke;
  }

  return null;
};

PokeGroup.prototype.clone = function() {
  return new PokeGroup(this.pokeCards);
};

PokeGroup.prototype.equals = function(other) {
  if (other == null)
    return false;

  return this.pokeValue == other.pokeValue && this.pokeCount == other.pokeCount;
};

Object.defineProperty(PokeGroup.prototype, 'length', {
  enumerable: false,
  get: function() { return this.pokeCards.length }
});


Object.defineProperty(PokeGroup.prototype, 'pokeValue', {
  enumerable: false,
  get: function() { return this.pokeCards[0].value }
});

module.exports = PokeGroup;