import { cn } from "@/components/ui/utils";

describe("cn (class name utility)", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("joins multiple class strings", () => {
    const result = cn("flex", "items-center", "gap-2");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("gap-2");
  });

  it("ignores falsy values (undefined, null, false)", () => {
    const result = cn("flex", undefined, null, false, "gap-2");
    expect(result).toContain("flex");
    expect(result).toContain("gap-2");
    expect(result).not.toContain("undefined");
    expect(result).not.toContain("null");
    expect(result).not.toContain("false");
  });

  it("handles conditional class objects", () => {
    const active = true;
    const disabled = false;
    const result = cn({ "bg-blue-500": active, "opacity-50": disabled });
    expect(result).toContain("bg-blue-500");
    expect(result).not.toContain("opacity-50");
  });

  it("resolves Tailwind conflicts — last value wins", () => {
    // twMerge removes duplicate Tailwind utilities; the later one wins
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("resolves conflicting text colours", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("resolves conflicting background colours", () => {
    const result = cn("bg-gray-100", "bg-white");
    expect(result).toBe("bg-white");
  });

  it("returns an empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("accepts arrays of classes", () => {
    const result = cn(["flex", "gap-4"]);
    expect(result).toContain("flex");
    expect(result).toContain("gap-4");
  });

  it("handles mixed strings, objects, and arrays", () => {
    const result = cn("flex", ["gap-2"], { "text-sm": true, "text-lg": false });
    expect(result).toContain("flex");
    expect(result).toContain("gap-2");
    expect(result).toContain("text-sm");
    expect(result).not.toContain("text-lg");
  });

  it("keeps non-conflicting Tailwind classes together", () => {
    const result = cn("flex", "text-sm", "font-bold");
    expect(result).toContain("flex");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-bold");
  });
});
