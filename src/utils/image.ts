/** Team logo preparation: PNGs are scaled to 64×64 (as the old panel did), SVGs are sent as they are. */

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Not an image"));
    image.src = src;
  });
}

/** Returns the data URL the API expects in `logo_file`, or throws when the file isn't a PNG/SVG image. */
export async function prepareLogo(file: File, size = 64): Promise<string> {
  if (file.type === "image/svg+xml") return readAsDataUrl(file);
  if (file.type !== "image/png") throw new Error("Not a PNG or SVG image");
  const image = await loadImage(await readAsDataUrl(file));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")?.drawImage(image, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}
