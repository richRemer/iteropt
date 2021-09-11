import expect from "expect.js";
import iterate from "iteropt";

describe("*iterate(object, string[])", () => {
  it("should iterate over options and arguments", () => {
    const argv = ["-x", "--yes", "file.txt"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.string).to.be("-x");
    expect(iterable.next().value.string).to.be("--yes");
    expect(iterable.next().value.string).to.be("file.txt");
    expect(iterable.next().done).to.be(true);
  });

  it("should support skipping initial args", () => {
    const argv = ["foo", "bar", "baz"];
    const iterable = iterate({skip_args: 2}, argv);

    expect(iterable.next().value.string).to.be("baz");
    expect(iterable.next().done).to.be(true);
  });

  it("should set name for GNU-style options", () => {
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
    const argv = ["-x", "X", "-yY", "-z:Z", "--foo", "FOO", "--bar=BAR"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.value).to.be("X");
    expect(iterable.next().value.value).to.be("Y");
    expect(iterable.next().value.value).to.be("Z");
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

  it("should recognize explicit value in short option", () => {
    const argv = ["-xy", "-Clib", "file.txt"];
    const iterable = iterate({skip_args: 0, val_chars: "C"}, argv);

    expect(iterable.next().value.name).to.be("-x");
    expect(iterable.next().value.name).to.be("-y");
    expect(iterable.next().value.name).to.be("-C");
    expect(iterable.next().value.string).to.be("file.txt");
    expect(iterable.next().done).to.be(true);
  });

  it("should recognize unambiguous value in short option", () => {
    const argv = ["-x:y"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.name).to.be("-x");
    expect(iterable.next().done).to.be(true);
  });

  it("should recognize unambiguous value in long option", () => {
    const argv = ["--foo=FOO"];
    const iterable = iterate({skip_args: 0}, argv);

    expect(iterable.next().value.name).to.be("--foo");
    expect(iterable.next().done).to.be(true);
  });

  it("should support plucking arguments", () => {
    const argv = ["-vCfoo", "--foo=FOO", "--", "file.txt", "-xy"];
    const iterable = iterate({pluck: true, skip_args: 0, val_chars: "C"}, argv);

    expect(iterable.next().value.name).to.be("-v");
    expect(iterable.next().value.name).to.be("-C");
    expect(iterable.next().value.name).to.be("--foo");
    expect(iterable.next().value.string).to.be("--");
    expect(iterable.next().value.string).to.be("file.txt");
    expect(iterable.next().value.string).to.be("-xy");
    expect(iterable.next().done).to.be(true);
    expect(argv.length).to.be(0);
  });

  it("should support plucking in caller", () => {
    const argv = ["-v", "--D", "-Cd", "--d=val", "--d", "val", "-vxCd"];
    const iterable = iterate({pluck: false, skip_args: 0, val_chars: "C"}, argv);
    let opt;

    // pluck flag options
    expect(pluckThenGetArg0()).to.be("--D");
    expect(pluckThenGetArg0()).to.be("-Cd");

    // pluck with values
    expect(pluckThenGetArg0()).to.be("--d=val");
    expect(pluckThenGetArg0()).to.be("--d");
    expect(getValueThenPluck()).to.be("val");
    expect(argv[0]).to.be("-vxCd");

    // pluck partial short option
    expect(pluckThenGetArg0()).to.be("-xCd");
    expect(iterable.next().value.name).to.be("-x");
    expect(pluckThenGetArg0()).to.be("-x");
    expect(iterable.next().done).to.be(true);

    function pluckThenGetArg0() {
      iterable.next().value.pluck();
      return argv[0];
    }

    function getValueThenPluck() {
      const opt = iterable.next().value;
      const val = opt.value;
      opt.pluck();
      return val;
    }
  });

  it("should not pluck skipped args", () => {
    const argv = ["skip", "foo"];
    const iterable = iterate({pluck: true, skip_args: 1}, argv);

    expect(iterable.next().value.string).to.be("foo");
    expect(iterable.next().done).to.be(true);
    expect(argv.length).to.be(1);
  });
});

describe("*iterate(string[])", () => {
  it("should skip first two arguments", () => {
    const argv = ["foo", "bar", "baz"];
    const iterable = iterate(argv);

    expect(iterable.next().value.string).to.be("baz");
    expect(iterable.next().done).to.be(true);
  });

  it("should not pluck arguments", () => {
    const argv = ["foo", "bar", "baz"];
    const iterable = iterate(argv);

    expect(iterable.next().value.string).to.be("baz");
    expect(iterable.next().done).to.be(true);
    expect(argv.length).to.be(3);
  });
});
