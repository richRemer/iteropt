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

for (let {opt, val, tok} of iteropt(args)) {
  switch (opt) {
    case "-v":  case "--verbose": verbosity++;  break;
    case "-q":  case "--quiet":   verbosity--;  break;
    case "-C":  case "--dir":     dir = val;    break;
    default: throw new Error(`unexpected argument: ${tok}`);
  }
}

console.log("verbosity:", verbosity);
console.log("dir:", dir);
console.log("args:", args);
```
