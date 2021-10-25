iteropt Generator
=================
The `iteropt` generator function iterates over command-line options.  Each
iteration yields an option with name and value or an argument string.

Example
-------

```js
const iteropt = require("iteropt");
const args = [...process.argv]; // iteropt skips first 2 args by default

let verbosity = 0;
let dir = process.cwd();

const iterate = iteropt("vqC:", "verbose", "quiet", "dir=");

for (let {name, value, string} of iteropt(args)) {
  switch (name) {
    case "-v":  case "--verbose": verbosity++;  break;
    case "-q":  case "--quiet":   verbosity--;  break;
    case "-C":  case "--dir":     dir = value;  break;
    default: throw new Error(`unexpected argument: ${string}`);
  }
}

console.log("verbosity:", verbosity);
console.log("dir:", dir);
console.log("args:", args);
```
