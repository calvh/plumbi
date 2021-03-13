const Filter = require("bad-words");
const filter = new Filter();

let input = "Привет힣";

try {
  const result = filter.clean(input);
  console.log(result);
} catch (err) {
  if (err instanceof TypeError) {
    // fully non-english string
    console.log("test");
  } else {
    // other error
    throw err;
  }
}
