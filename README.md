iteropt Generator
=================
The `iteropt` generator function iterates over command-line options.  Each
iteration yields an option with option name and value or an argument with a
string token value.

Example
-------

```js
const iteropt = require("iteropt");
const args = [...process.argv]; // iteropt skips first 2 args by default

let verbosity = 0;
let dir = process.cwd();

const iterate = iteropt("vqC:", "verbose", "quiet", "dir=");

for (let {opt, val, tok, err} of iterate(...args)) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  switch (opt) {
    case "-v":  case "--verbose": verbosity++;  break;
    case "-q":  case "--quiet":   verbosity--;  break;
    case "-C":  case "--dir":     dir = val;    break;
    default:
      console.error(`unexpected argument -- ${tok}`);
      process.exit(1);
  }
}

console.log("verbosity:", verbosity);
console.log("dir:", dir);
console.log("args:", args);
```
