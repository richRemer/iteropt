iteropt Generator
=================
The `iteropt` generator function iterates over command-line options.  Each
iteration yields a 2-tuple with the option name and a function which can be used
to read the option value.

The arguments passed to the `iteropt` function are removed as they are read.  By
calling the second function argument to read the option value, additional
arguments may be consumed.

When the `iteropt` function encounters a non-option argument, no more values
will be yielded.

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
