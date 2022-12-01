import expect from "expect.js";
import iterator from "iteropt";

describe("iterator(string, ...string)", () => {
  it("should return *iterate function", () => {
    const iterate = iterator("");
    expect(iterate).to.be.a("function");
    expect(iterate.name).to.be("iterate");

    const iterable = iterate("node", "script");
    expect(iterable.next).to.be.a("function");
  });
});

describe("*iterate(...string)", () => {
  let iterate;

  beforeEach(() => {
    iterate = iterator("xyA:B:", "yes", "foo:", "bar:");
  });

  it("should iterate over options and arguments", () => {
    const argv = ["-x", "--yes", "file.txt"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.opt).to.be("-x");
    expect(iterable.next().value.opt).to.be("--yes");
    expect(iterable.next().value.tok).to.be("file.txt");
    expect(iterable.next().done).to.be(true);
  });

  it("should set name for POSIX/GNU-style options", () => {
    const argv = ["-x", "--yes", "file.txt"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.opt).to.be("-x");
    expect(iterable.next().value.opt).to.be("--yes");
    expect(iterable.next().value.opt).to.be(undefined);
    expect(iterable.next().done).to.be(true);
  });

  it("should expand combined short options", () => {
    const argv = ["-xy"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.opt).to.be("-x");
    expect(iterable.next().value.opt).to.be("-y");
    expect(iterable.next().done).to.be(true);
  });

  it("should support parsing option values", () => {
    const argv = ["-A", "1", "-B2", "--foo", "FOO", "--bar=BAR"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.val).to.be("1");
    expect(iterable.next().value.val).to.be("2");
    expect(iterable.next().value.val).to.be("FOO");
    expect(iterable.next().value.val).to.be("BAR");
    expect(iterable.next().done).to.be(true);
  });

  it("should terminate options parsing after '--'", () => {
    const argv = ["-x", "--", "-xy"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.opt).to.be("-x");
    expect(iterable.next().value.tok).to.be("--");

    const option = iterable.next().value;

    expect(option.tok).to.be("-xy");
    expect(option.opt).to.be(undefined);
    expect(iterable.next().done).to.be(true);
  });

  it("should recognize unambiguous value in long option", () => {
    const argv = ["--foo=FOO"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.opt).to.be("--foo");
    expect(iterable.next().done).to.be(true);
  });

  it("should end iteration on error", () => {
    const argv = ["-A", "--option-like"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.err).to.be.a("string");
    expect(iterable.next().done).to.be(true);
  });

  it("should error if expected argument looks like option", () => {
    const argv = ["-A", "--option-like"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.err).to.be.a("string");
  });

  it("should error if argument includes unexpected value", () => {
    const argv = ["--yes=foo"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.err).to.be.a("string");
  });

  it("should error if option is not defined", () => {
    for (const arg of ["-a", "--unknown", "-xa"]) {
      const iterable = iterate(arg);

      expect(iterable.next().value.err).to.be.a("string");
    }
  });

  it("should error if final argument is missing", () => {
    const argv = ["--foo"];
    const iterable = iterate(...argv);

    expect(iterable.next().value.err).to.be.a("string");
  });
});

describe("iterate(...string, {console})", () => {
  let iterate, console, calledWith;

  beforeEach(() => {
    iterate = iterator("xyA:B:", "yes", "foo:", "bar:");
    console = {error(msg) { calledWith = msg; }};
  });

  it("should log errors", () => {
    const argv = ["--unknown"];
    const iterable = iterate(argv, {console});
    const {err} = iterable.next().value;

    expect(err).to.be.a("string");
    expect(calledWith).to.be(err);
  });
});

