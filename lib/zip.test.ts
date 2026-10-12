import { describe, expect, it } from "vitest";

import { bundlePngs } from "./zip";

describe("receipt ZIP", () => {
  it("stores every page as a named file", async () => {
    const bundle = await bundlePngs([
      { name: "halaman-1.png", blob: new Blob([new Uint8Array([1, 2, 3])]) },
      { name: "halaman-2.png", blob: new Blob([new Uint8Array([4, 5])]) },
    ]);
    const bytes = new Uint8Array(await bundle.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const text = new TextDecoder().decode(bytes);

    expect(bundle.type).toBe("application/zip");
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(bytes.length - 12, true)).toBe(2);
    expect(text).toContain("halaman-1.png");
    expect(text).toContain("halaman-2.png");
  });
});
