iteropt Generator
=================
The `iteropt` generator function iterates over command-line options.

Example
-------

```js
const iteropt = require("iteropt");
const args = process.argv.slice(2); // first two args are node and script

let verbosity = 0;
let dir = process.cwd();

try {
    for (let [opt, optval] of iteropt(args)) {
        switch (opt) {
            case "-v":
            case "--verbose":
                verbosity++;
                break;
            case "-q":
            case "--quiet":
                verbosity--;
                break;
            case "-C":
            case "--dir":
                dir = optval();
                break;
            default:
                throw new iteropt.CLIError(`unknown option ${opt}`);
        }
    }
} catch (err) {
    if (err instanceof CLIError) {
        console.error(err.message);
    } else {
        console.error(err.stack);
    }
}

console.log("verbosity:", verbosity);
console.log("dir:", dir);
console.log("args:", args);
```
