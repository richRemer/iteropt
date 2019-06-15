const expect = require("expect.js");
const iteropt = require("..");

describe("*iteropt(string[])", () => {
    let argv;

    beforeEach(() => {
        argv = ["--foo", "bar", "--baz=bang", "-zdfoo", "--", "--blargh"];
    });

    it("should return an iterator", () => {
        const result = iteropt(argv);
        expect(result).to.be.an("object");
        expect(result.next).to.be.a("function");
    });

    it("should read options from arguments", () => {
        const iter = iteropt(argv);
        const [opt] = iter.next().value;

        expect(opt).to.be("--foo");
    });

    it("should allow reading option value", () => {
        const iter = iteropt(argv);
        let opt, optval;

        [opt, optval] = iter.next().value;
        expect(opt).to.be("--foo");
        expect(optval()).to.be("bar");

        [opt, optval] = iter.next().value;
        expect(opt).to.be("--baz");
        expect(optval()).to.be("bang");
    });

    it("should expand single-letter options", () => {
        const iter = iteropt(argv);
        let opt, optval;

        iter.next().value[1]();     // --foo bar
        iter.next().value[1]();     // --baz=bang

        [opt, optval] = iter.next().value;
        expect(opt).to.be("-z");

        [opt, optval] = iter.next().value;
        expect(opt).to.be("-d");
        expect(optval()).to.be("foo");
    });

    it("should recognize option terminator", () => {
        const iter = iteropt(argv);

        iter.next().value[1]();     // --foo bar
        iter.next().value[1]();     // --baz=bang
        iter.next().value[1]();     // -zdfoo

        expect(iter.next().done).to.be(true);
    });

    it("should leave leftover arguments", () => {
        const iter = iteropt(argv);

        iter.next().value[1]();     // --foo bar
        iter.next().value[1]();     // --baz=bang
        iter.next().value[1]();     // -zdfoo
        iter.next();

        expect(argv.length).to.be(1);
        expect(argv[0]).to.be("--blargh");
    });

    it("should error if option value is not available", () => {
        const iter = iteropt(["--foo"]);
        expect(iter.next().value[1]).to.throwError();
    });

    it("should error if option value is not read", () => {
        argv = ["--foo=bar"];

        const iter = iteropt(argv);

        iter.next();
        expect(() => iter.next()).to.throwError();
    });

    it("should set optval.required if option value must be read", () => {
        const iter = iteropt(argv);
        let opt, optval;

        [opt, optval] = iter.next().value;  // --foo bar
        expect(optval.required).to.be(undefined);
        optval();

        [opt, optval] = iter.next().value;  // --baz=bang
        expect(optval.required).to.be(true);
        optval();

        [opt, optval] = iter.next().value;  // -zdfoo
        expect(optval.required).to.be(undefined);
    });

    it("should errror if option value is read twice", () => {
        const iter = iteropt(argv);
        const [opt, optval] = iter.next().value;

        optval();
        expect(optval).to.throwError();
    });
});
