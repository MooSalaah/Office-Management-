const mongoose = require('mongoose');

const id = "17644062662464644";
const isValid = mongoose.Types.ObjectId.isValid(id);

console.log(`ID: ${id}`);
console.log(`Length: ${id.length}`);
console.log(`isValid: ${isValid}`);
