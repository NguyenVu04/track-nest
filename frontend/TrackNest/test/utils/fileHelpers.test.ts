import { createFileFromImagePicker } from "@/utils/fileHelpers";

describe("createFileFromImagePicker", () => {
  it("returns null when assets array is empty", () => {
    expect(createFileFromImagePicker({ assets: [] })).toBeNull();
  });

  it("returns null when assets is undefined", () => {
    expect(createFileFromImagePicker({})).toBeNull();
  });

  it("returns file data from the first asset with all fields provided", () => {
    const result = createFileFromImagePicker({
      assets: [{ uri: "file://photo.jpg", fileName: "photo.jpg", type: "image/jpeg" }],
    });
    expect(result).toEqual({
      uri: "file://photo.jpg",
      filename: "photo.jpg",
      type: "image/jpeg",
    });
  });

  it("uses default filename when fileName is missing", () => {
    const before = Date.now();
    const result = createFileFromImagePicker({
      assets: [{ uri: "file://img.jpg" }],
    });
    const after = Date.now();

    expect(result).not.toBeNull();
    expect(result!.uri).toBe("file://img.jpg");
    expect(result!.type).toBe("image/jpeg");

    const match = result!.filename.match(/^image_(\d+)\.jpg$/);
    expect(match).not.toBeNull();
    const ts = Number(match![1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("uses default type when type is missing", () => {
    const result = createFileFromImagePicker({
      assets: [{ uri: "file://img.jpg", fileName: "img.jpg" }],
    });
    expect(result!.type).toBe("image/jpeg");
  });

  it("picks only the first asset when multiple are provided", () => {
    const result = createFileFromImagePicker({
      assets: [
        { uri: "file://first.jpg", fileName: "first.jpg", type: "image/jpeg" },
        { uri: "file://second.jpg", fileName: "second.jpg", type: "image/png" },
      ],
    });
    expect(result!.uri).toBe("file://first.jpg");
    expect(result!.filename).toBe("first.jpg");
  });
});
