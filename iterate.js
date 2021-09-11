/**
 * @param {object} [options]
 * @param {boolean} [options.pluck]     Remove options from arguments array
 * @param {number} [options.skip_args]  Number of initial arguments to skip
 * @param {string} [options.val_chars]  Extra short options requiring values
 * @param {string[]} argv               Arguments array
 * @yields {CLIOption}
 */
export default function* iterate({
  pluck=false,
  skip_args=2,
  val_chars=""
}={}, argv) {
  if (arguments.length === 1) {
    argv = arguments[0];
  }

  const state = new IterationState({argv, index: skip_args, val_chars});

  while (!state.complete) {
    yield new CLIOption(state);
    if (pluck && state.argstate !== "plucked") state.pluck();
    state.next();
  }
}

class IterationState {
  constructor({argv, index=0, char_index=false, val_chars=""}) {
    this.argv = argv;
    this.index = index;
    this.char_index = char_index;
    this.val_chars = val_chars
    this.argstate = "next";
    this.terminated = false;
    this.normalize();
  }

  get complete() {
    return this.index >= this.argv.length;
  }

  get name() {
    if (this.terminated) {
      return undefined;
    } else if (this.short()) {
      const char = this.string[this.char_index];
      return char ? "-"+char : undefined;
    } else if (this.long() && this.char_index) {
      return this.string.slice(0, this.char_index-1);
    } else if (this.long()) {
      return this.string;
    }
  }

  get string() {
    return this.argv[this.index];
  }

  get value() {
    if (!this.terminated) {
      this.argstate = "valued";

      if (this.short() && this.string[this.char_index+1] === ":") {
        return this.string.slice(this.char_index+2);
      } else if (this.short() && this.char_index < this.string.length-1) {
        return this.string.slice(this.char_index+1);
      } else if (this.long() && this.char_index) {
        return this.string.slice(this.char_index);
      }
    }
  }

  long() {
    return !this.terminated && /^--[a-z0-9]/i.test(this.string);
  }

  next() {
    if (this.argstate !== "plucked") {
      const by_char = this.short() && this.char_index+1<this.string.length
        && this.argstate !== "valued" && this.string[this.char_index+1] !== ":"
        && !this.val_chars.includes(this.string[this.char_index]);

      if (by_char) {
        this.char_index++;
      } else {
        this.char_index = false;
        this.index++;
      }

      if (this.argstate === "peeked") {
        this.index++;
      }
    }

    this.argstate = "next";
    this.normalize();
  }

  normalize() {
    if (this.string === "--") {
      this.terminated = true;
    } else if (this.char_index === false && this.short()) {
      this.char_index = 1;
    } else if (this.char_index === false && this.long()) {
      this.char_index = this.string.indexOf("=") + 1;
    }
  }

  peek() {
    if (this.index+1 < this.argv.length) {
      this.argstate = "peeked";
      return this.argv[this.index+1];
    } else {
      throw new Error(`missing value for ${this.name} option`);
    }
  }

  pluck() {
    const {argstate, argv, char_index, index, string, val_chars} = this;

    if (argstate !== "plucked") {
      const short = this.short();
      const valued = argstate === "valued";
      const has_data = short && char_index+1<string.length;
      const has_val = valued || val_chars.includes(string[char_index]);

      if (argstate === "peeked" || (short && !has_data && has_val)) {
        argv.splice(index+1, 1);
      }

      if (short && has_data && has_val && char_index>1) {
        argv[index] = string.slice(0, char_index);
        this.index++;
        this.char_index = false;
      } else if (short && has_data && !has_val) {
        argv[index] = string.slice(0, char_index) + string.slice(char_index+1);
      } else {
        argv.splice(index, 1);
        this.char_index = false;
      }

      this.argstate = "plucked";
      this.normalize();
    }
  }

  short() {
    return !this.terminated && /^-[a-z0-9]/i.test(this.string);
  }
}

class CLIOption {
  constructor(state) {
    Object.defineProperty(this, "state", {
      configurable: true,
      value: state
    });
  }

  get name() {
    return this.state.name;
  }

  get string() {
    return this.state.string;
  }

  get value() {
    return this.state.value || this.state.peek();
  }

  pluck() {
    this.state.pluck();
    this.destroy();
  }

  destroy() {
    Object.defineProperty(this, "state", {
      configurable: true,
      value: undefined
    });
  }
}
