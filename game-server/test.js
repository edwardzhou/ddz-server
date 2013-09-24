var foo = function(arg1, arg2)  {
  console.log(arg1, arg2);
};

var bar = function(callback) {
  callback(3);
};

foo(1,2);

bar(foo.bind(null, 4, 5));

var s = ["one", "two", "three"];

var i = s.indexOf("twox");

//delete s[i];
s.splice(i, 1);

console.log(s, i);

for (var index in s) {
  console.log(index, s[index]);
}