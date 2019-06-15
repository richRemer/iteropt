/**
 * Iterate over argument options.
 * @param {string[]} args
 */
function* iterate(args) {
    let opt, val, valread;

    while (args.length) {
        const curr = args.shift();

        reset();

        if (terminator(curr)) {
            return;
        } else if (longopt(curr) && hasval(curr)) {
            [opt, val] = splitlong(curr);
            optval.required = true;
            yield [opt, optval];
        } else if (shortopt(curr) && hasval(curr)) {
            [opt, val] = [curr.slice(0,2), curr.slice(2)];
            yield [opt, optval];
        } else if (longopt(curr) || shortopt(curr)) {
            opt = curr;
            yield [opt, optval];
        } else {
            args.unshift(curr);
            return;
        }

        if (longopt(curr) && hasval(curr) && !valread) {
            throw new CLIError(`unexpected value for ${opt} option`);
        } else if (shortopt(curr) && hasval(curr) && !valread) {
            args.unshift(`-${val}`);
        }
    }

    function reset() {
        opt = undefined;
        val = undefined;
        valread = false;
        delete optval.required;
    }

    function optval() {
        if (valread) {
            throw new Error("optval called more than once");
        } else if (val !== undefined) {
            valread = true;
        } else if (args.length) {
            val = args.shift();
            valread = true;
        } else {
            throw new CLIError(`option ${opt} expects value`);
        }

        return val;
    }
}

class CLIError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

module.exports = iterate;
module.exports.CLIError = CLIError;

/**
 * Return true if argument is a terminator.
 * @param {string} arg
 * @returns {boolean}
 */
function terminator(arg) {return arg === "--";}

/**
 * Return true if argument is a long option.
 * @param {string} arg
 * @returns {boolean}
 */
function longopt(arg) {return /^--[a-z0-9].*/i.test(arg);}

/**
 * Return true if argument is a short option.
 * @param {string} arg
 * @returns {boolean}
 */
function shortopt(arg) {return /^-[a-z0-9]/i.test(arg);}

/**
 * Return true if argument has an attached option value.
 * @param {string} arg
 * @returns {boolean}
 */
function hasval(arg) {
    return longopt(arg) && arg.includes("=")
        || shortopt(arg) && arg.length > 2;
}

/**
 * Split long option with attached value into its constituent components.
 * @param {string} arg
 * @returns {string[]}
 */
function splitlong(arg) {
    let [opt, ...val] = arg.split("=");
    return [opt, val.join("=")];
}
