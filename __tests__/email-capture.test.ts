import { describe, it, expect } from "vitest";
import { extractEmail } from "../lib/email-capture";

describe("extractEmail", () => {
  it("reads a bare address", () => {
    expect(extractEmail("kassim@example.com")).toBe("kassim@example.com");
  });

  it("finds an address inside a sentence and lowercases it", () => {
    expect(extractEmail("Mon mail c'est Kassim.B+elevate@Example.BE merci !")).toBe(
      "kassim.b+elevate@example.be"
    );
  });

  it("accepts subdomains and short local parts", () => {
    expect(extractEmail("a@mail.example.co.uk")).toBe("a@mail.example.co.uk");
  });

  it.each(["", "salut", "@home", "kassim@", "kassim@example", "kassim @ example.com"])(
    "rejects %j",
    (text) => {
      expect(extractEmail(text)).toBeNull();
    }
  );

  it("rejects an address longer than 254 characters", () => {
    expect(extractEmail(`${"a".repeat(250)}@example.com`)).toBeNull();
  });
});
