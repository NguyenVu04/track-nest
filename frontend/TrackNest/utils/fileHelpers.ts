export function createFileFromImagePicker(
  result: { assets?: Array<{ uri: string; fileName?: string; type?: string }> },
): { uri: string; filename: string; type: string } | null {
  if (!result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    filename: asset.fileName || `image_${Date.now()}.jpg`,
    type: asset.type || "image/jpeg",
  };
}
