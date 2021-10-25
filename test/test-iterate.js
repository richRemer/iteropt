import expect from "expect.js";
import iterator from "iteropt";

describe("iterator(string, ...string)", () => {
  it("should return *iterate function", () => {
    const iterate = iterator("");
    expect(iterate).to.be.a("function");
    expect(iterate.name).to.be("iterate");

    const iterable = iterate(["node", "script"]);
    expect(iterable.next).to.be.a("function");
  });
});

describe("*iterate(object, string[])", () => {
  let iterate;

  beforeEach(() => {
    iterate = iterator("xyA:B:", "yes", "foo=", "bar=");
  });

  it("should iterate over options and arguments", () => {
    const argv = ["-x", "--yes", "file.txt"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.name).to.be("-x");
    expect(iterable.next().value.name).to.be("--yes");
    expect(iterable.next().value.string).to.be("file.txt");
    expect(iterable.next().done).to.be(true);
  });

  it("should support skipping initial args", () => {
    const argv = ["foo", "bar", "baz"];
    const iterable = iterate({skip_args: 2}, argv);

    expect(iterable.next().value.string).to.be("baz");
    expect(iterable.next().done).to.be(true);
  });

  it("should set name for POSIX/GNU-style options", () => {
    const argv = ["-x", "--yes", "file.txt"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.name).to.be("-x");
    expect(iterable.next().value.name).to.be("--yes");
    expect(iterable.next().value.name).to.be(undefined);
    expect(iterable.next().done).to.be(true);
  });

  it("should expand combined short options", () => {
    const argv = ["-xy"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.name).to.be("-x");
    expect(iterable.next().value.name).to.be("-y");
    expect(iterable.next().done).to.be(true);
  });

  it("should support parsing option values", () => {
    const argv = ["-A", "1", "-B2", "--foo", "FOO", "--bar=BAR"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.value).to.be("1");
    expect(iterable.next().value.value).to.be("2");
    expect(iterable.next().value.value).to.be("FOO");
    expect(iterable.next().value.value).to.be("BAR");
    expect(iterable.next().done).to.be(true);
  });

  it("should terminate options parsing after '--'", () => {
    const argv = ["-x", "--", "-xy"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.name).to.be("-x");
    expect(iterable.next().value.string).to.be("--");

    const opt = iterable.next().value;

    expect(opt.string).to.be("-xy");
    expect(opt.name).to.be(undefined);
    expect(iterable.next().done).to.be(true);
  });

  it("should recognize unambiguous value in long option", () => {
    const argv = ["--foo=FOO"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.name).to.be("--foo");
    expect(iterable.next().done).to.be(true);
  });

  it("should throw if expected argument looks like option", () => {
    const argv = ["-A", "--option-like"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(() => iterable.next()).to.throwError();
  });

  it("should throw if argument includes unexpected value", () => {
    const argv = ["--yes=foo"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(() => iterable.next()).to.throwError();
  });

  it("should throw if option is not defined", () => {
    for (const arg of ["-a", "--unknown", "-xa"]) {
      const iterable = iterate({skip_args: 0}, [arg]);

      expect(() => iterable.next()).to.throwError();
    }
  });

  it("should throw if final argument is missing", () => {
    const argv = ["--foo"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(() => iterable.next()).to.throwError();
  });
});

describe("*iterate(string[])", () => {
  let iterate;

  beforeEach(() => {
    iterate = iterator("");
  });

  it("should skip first two arguments", () => {
    const argv = ["foo", "bar", "baz"];
    const iterable = iterate(argv);

    expect(iterable.next().value.string).to.be("baz");
    expect(iterable.next().done).to.be(true);
  });
});
