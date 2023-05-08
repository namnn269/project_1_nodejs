const fs = require('fs');
const util = require('util');

const arr = [1, 2, 3];
const arr2 = arr;
arr.unshift(6);

console.log('arr 1: ', arr);
console.log('arr 2 2: ', arr2);
