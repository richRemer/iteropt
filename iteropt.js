export default function iterator(posix, ...gnu) {
  return function* iterate({error=()=>{}}={}, argv) {
    const parser = new Parser(posix, ...gnu);
    let lastToken, terminated = false;

    if (arguments.length === 1) {
      argv = arguments[0];
    }

    for (const arg of argv) {
      const parsed = parser.parse(arg);

      if (parsed instanceof Error) {
        error(parsed.message);
        throw parsed;
      }

      for (const token of parsed) {
        if (terminated) {
          yield {string: token, parser};
        } else if (token === "--") {
          yield {string: token, parser};
          terminated = true;
        } else if (needValue(parser, lastToken)) {
          yield {name: lastToken, value: token, parser};
        } else if (Parser.isOption(token) && !needValue(parser, token)) {
          yield {name: token, value: true, parser};
        } else if (!Parser.isOption(token)) {
          yield {string: token, parser};
        }

        lastToken = token;
      }
    }

    const err = parser.end();

    if (err) {
      error(err.message);
      throw err;
    }
  }
}

export class CLIError extends Error {};

class Parser {
  constructor(posix, ...gnu) {
    this.defined = {};
    this.terminated = false;
    this.expectsArgument = false;

    this.define(posix, ...gnu);
  }

  static isGnuOption(token) {
    return /^--[a-z0-9][-a-z0-9_]*[a-z0-9](=.*)?$/i.test(token);
  }

  static isOption(token) {
    return Parser.isPosixOption(token) || Parser.isGnuOption(token);
  }

  static isPosixOption(token) {
    return /^-[a-z0-9]/i.test(token);
  }

  define(posix, ...gnu) {
    let lastch;

    for (const ch of posix) {
      if (ch === ":" && lastch && lastch !== ":") {
        this.defined[lastch] = true;
      } else if (ch === ":") {
        throw new Error("value specifier without option specifier");
      } else if (ch in this.defined) {
        throw new Error(`option specifier '${ch}' redefined`);
      } else if (/[a-z0-9]/i.test(ch)) {
        this.defined[ch] = false;
        lastch = ch;
      } else {
        throw new Error(`'${ch}' is not a valid option specifier`);
      }
    }

    for (let opt of gnu) {
      let value = false;

      if ("=" === opt.slice(-1)) {
        value = true;
        opt = opt.slice(0, -1);
      }

      if (!opt) {
        throw new Error("empty option specifier");
      } else if (opt in this.defined) {
        throw new Error(`option specifier '${opt}' redefined`);
      } else if (/^[a-z0-9][-a-z0-9_]*[a-z0-9]$/i.test(opt)) {
        this.defined[opt] = value;
      } else {
        throw new Error(`'${opt}' is not a valid option specifier`);
      }
    }
  }

  parse(token) {
    if (this.terminated) {
      return [token];
    } else if (this.expectsArgument && token[0] === "-") {
      return new CLIError(`option expects argument -- ${this.expectsArgument}`);
    } else if (this.expectsArgument) {
      this.expectsArgument = false;
      return [token];
    } else if (token === "--") {
      this.terminated = true;
      return [token];
    } else if (Parser.isGnuOption(token) && token.includes("=")) {
      const option = token.split("=", 1)[0].slice(2);

      if (this.defined[option] === false) {
        return new CLIError(`option expects no argument -- ${option}`);
      } else if (this.defined[option] === true) {
        const i = token.indexOf("=");
        return [token.slice(0, i), token.slice(i+1)];
      } else {
        return new CLIError(`illegal option -- ${option}`);
      }
    } else if (Parser.isGnuOption(token)) {
      const option = token.slice(2);

      if (this.defined[option] === false) {
        return [token];
      } else if (this.defined[option] === true) {
        this.expectsArgument = option;
        return [token];
      } else {
        return new CLIError(`illegal option -- ${option}`);
      }
    } else if (Parser.isPosixOption(token)) {
      const chars = token.slice(1);
      const tokens = [];

      for (const ch of chars) {
        if (this.defined[ch] === false) {
          tokens.push(`-${ch}`);
        } else if (this.defined[ch] === true) {
          const value = token.slice(token.indexOf(ch)+1);

          if (value) {
            tokens.push(`-${ch}`, value);
            break;
          } else {
            tokens.push(`-${ch}`);
            this.expectsArgument = ch;
          }
        } else {
          return new CLIError(`illegal option -- ${ch}`);
        }
      }

      return tokens;
    } else {
      return [token];
    }
  }

  end() {
    if (this.expectsArgument) {
      return new CLIError(`option expects argument -- ${this.expectsArgument}`);
    }
  }
}

function needValue(parser, option) {
  if (Parser.isGnuOption(option)) {
    return parser.defined[option.slice(2)];
  } else if (Parser.isPosixOption(option)) {
    return parser.defined[option[1]];
  }
}