const expect = require("expect.js");
const iteropt = require("..");

describe("iteropt(string[])", () => {
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
        let done = false;
        let foo = false;

        for (let [opt] of iteropt(argv)) {
            switch (opt) {
                case "--foo": foo = true; break;
                default: done = true;
            }

            if (done) break;
        }

        expect(foo).to.be(true);
    });

    it("should allow reading option value", () => {
        let done = false;
        let foo = false;
        let baz = false;

        for (let [opt, optval] of iteropt(argv)) {
            switch (opt) {
                case "--foo": foo = optval(); break;
                case "--baz": baz = optval(); break;
                default: done = true;
            }

            if (done) break;
        }

        expect(foo).to.be("bar");
        expect(baz).to.be("bang");
    });

    it("should expand single-letter options", () => {
        let done = false;
        let zeta = false;
        let delta = false;

        for (let [opt, optval] of iteropt(argv)) {
            switch (opt) {
                case "--foo": optval(); break;
                case "--baz": optval(); break;
                case "-z": zeta = true; break;
                case "-d": delta = optval(); break;
                default: done = true;
            }

            if (done) break;
        }

        expect(zeta).to.be(true);
        expect(delta).to.be("foo");
    });

    it("should recognize option terminator", () => {
        let delta = false;

        for (let [opt, optval] of iteropt(argv)) {
            switch (opt) {
                case "--foo":
                case "--baz":
                case "-d": delta = optval(); break;
                case "-z": break;
                default: throw new Error("iterator did not terminate");
            }
        }

        expect(delta).to.be("foo");
        expect(argv[0]).to.be("--blargh")
    });

    it("should error if option value is not available", () => {
        let foo = false;
        argv = ["--foo"];

        for (let [opt, optval] of iteropt(argv)) {
            switch (opt) {
                case "--foo":
                    foo = true;
                    expect(optval).to.throwError();
                    break;
                default: throw new Error("should not be here");
            }
        }

        expect(foo).to.be(true);
    });

    it("should error if option value is not read", () => {
        argv = ["--foo=bar"];

        expect(read).to.throwError();

        function read() {
            for (let [opt, optval] of iteropt(argv)) {
                // just looping to end
            }
        }
    });

    it("should errror if option value is read twice", () => {
        for (let [opt, optval] of iteropt(argv)) {
            optval();
            expect(optval).to.throwError();
            break;
        }
    });
});
