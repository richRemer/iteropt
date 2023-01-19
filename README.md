iteropt Generator
=================
The `iteropt` generator function iterates over command-line options.  Each
iteration yields an option with option name and value or an argument with a
string token value.

Example
-------

```js
import makeIteropt from "iteropt";

const args = [...process.argv.slice(2)];

let verbosity = 0;
let dir = process.cwd();

const iteropt = makeIteropt("vqC:", "verbose", "quiet", "dir:");

for (let {
  opt,      // set to option name if argument is option
  val,      // set to option value if option has value
  tok,      // set to un-parsed argument if not option
  err       // set to error message if parse error occurs
} of iteropt(...args)) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  switch (opt || tok) {
    case "-v":  case "--verbose": verbosity++;  break;
    case "-q":  case "--quiet":   verbosity--;  break;
    case "-C":  case "--dir":     dir = val;    break;
    case "--":                                  break;
    default:
      console.error(`unexpected argument -- ${tok}`);
      process.exit(1);
  }
}

console.log("verbosity:", verbosity);
console.log("dir:", dir);
```

Compatibility
-------------
Option parsing is based on the GNU **getopt** command, which in turn is based
on **getopt()** from *<unistd.h>*.  Some features are not currently supported:

 * allowing long options to start with "-" (**-a**, **--alternate** option)
 * setting POSIXLY_CORRECT environment variable to set scanning mode
 * setting GETOPT_COMPATIBLE environment variable for compatibility with shell
   built-ins
 * specifying "::" to allow optional arguments
