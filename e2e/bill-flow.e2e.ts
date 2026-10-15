import { expect, test, type Download, type Page } from "@playwright/test";

import { createBlankBill, type BillDraft } from "../lib/bill";

function quickBill() {
  const bill = createBlankBill("keyboard");
  bill.title = "Makan siang";
  bill.participants[0] = { id: "person-1", name: "Malik Nahar", quickAmount: 60_000 };
  bill.participants[1] = { id: "person-2", name: "Fadel", quickAmount: 40_000 };
  bill.quickSubtotal = 100_000;
  bill.payerId = "person-2";
  return bill;
}

function largeBill() {
  const bill = quickBill();
  bill.mode = "itemized";
  bill.participants = Array.from({ length: 12 }, (_, index) => ({ id: `person-${index}`, name: `Orang ${index + 1}`, quickAmount: 0 }));
  bill.items = Array.from({ length: 20 }, (_, index) => ({ id: `item-${index}`, name: `Menu ${index + 1}`, unitPrice: 10_000, quantity: 2, participantIds: bill.participants.map((person) => person.id) }));
  bill.payerId = "person-0";
  return bill;
}

async function seedBill(page: Page, bill: BillDraft) {
  await page.addInitScript((draft) => {
    localStorage.setItem("splitdulu:v1", JSON.stringify({ version: 1, draft, recent: [] }));
  }, bill);
}

async function pngDimensions(download: Download) {
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  expect(download.suggestedFilename()).not.toContain("halaman");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

test("Enter advances through quick fields and opens the result and receipt", async ({ page }) => {
  await seedBill(page, quickBill());
  await page.goto("/split");
  const person1 = page.getByRole("textbox", { name: "Nama orang 1", exact: true });
  const person2 = page.getByRole("textbox", { name: "Nama orang 2", exact: true });
  await expect(person1).toHaveValue("Malik Nahar");
  await page.getByLabel("Nama bill", { exact: false }).press("Enter");
  await expect(person1).toBeFocused();
  await person1.fill("Malik");
  await person1.press("End");
  await person1.press("Space");
  await person1.pressSequentially("Nahar");
  await expect(person1).toHaveValue("Malik Nahar");
  await person1.press("Enter");
  await expect(person2).toBeFocused();
  await person2.press("Enter");
  await expect(page.getByLabel("Subtotal sebelum diskon")).toBeFocused();
  await expect(page.getByRole("textbox", { name: /Nama orang/ })).toHaveCount(2);

  for (const id of ["quick-subtotal", "quick-person-1", "quick-person-2", "discount", "tax", "service"]) {
    await expect(page.locator(`#${id}`)).toBeFocused();
    await page.locator(`#${id}`).press("Enter");
  }
  const payer = page.getByRole("combobox", { name: "Siapa yang bayar" });
  await expect(payer).toBeFocused();
  await payer.press("Enter");
  const result = page.getByRole("button", { name: "Lihat Hasil" });
  await expect(result).toBeFocused();
  await result.press("Enter");
  await expect(page).toHaveURL(/\/result$/);
  await page.getByRole("button", { name: "Struk semua orang" }).press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PNG" })).toBeEnabled();
});

test("item inputs advance without triggering destructive buttons or swallowing spaces", async ({ page }) => {
  const bill = quickBill();
  bill.mode = "itemized";
  await seedBill(page, bill);
  await page.goto("/split");
  const person2 = page.getByRole("textbox", { name: "Nama orang 2", exact: true });
  await expect(person2).toHaveValue("Fadel");
  await person2.press("Enter");
  const addItem = page.getByRole("button", { name: "Tambah pesanan" });
  await expect(addItem).toBeFocused();
  await addItem.press("Enter");
  const name = page.getByLabel("Nama pesanan", { exact: true });
  await expect(name).toBeFocused();
  await name.fill("Ayam geprek");
  await name.press("Enter");
  const price = page.getByLabel("Harga / item", { exact: true });
  await expect(price).toBeFocused();
  await price.fill("20k");
  await price.press("Enter");
  const qty = page.getByLabel("Qty", { exact: true });
  await expect(qty).toBeFocused();
  await qty.press("Enter");
  await expect(page.getByLabel("Diskon", { exact: true })).toBeFocused();
  await expect(name).toHaveValue("Ayam geprek");
  await expect(page.getByRole("button", { name: "Hapus item 1" })).toBeVisible();
});

test("legacy receipt-total mismatches no longer block results", async ({ page }) => {
  await seedBill(page, { ...quickBill(), expectedSubtotal: 1, expectedTotal: 1 } as BillDraft);
  await page.goto("/split");
  await expect(page.getByRole("button", { name: "Lihat Hasil" })).toBeEnabled();
  await expect(page.getByText("Cek total struk", { exact: true })).toHaveCount(0);
  await expect(page.locator("#expected-total, #expected-subtotal")).toHaveCount(0);
  await page.getByRole("button", { name: "Lihat Hasil" }).click();
  await expect(page).toHaveURL(/\/result$/);
});

test("invalid numbers and composing Enter do not advance or open results", async ({ page }) => {
  await seedBill(page, quickBill());
  await page.goto("/split");
  const first = page.getByRole("textbox", { name: "Nama orang 1", exact: true });
  await expect(first).toHaveValue("Malik Nahar");
  await first.focus();
  await first.dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await expect(first).toBeFocused();
  const discount = page.getByLabel("Diskon", { exact: true });
  await discount.fill("oops");
  await expect(discount).toHaveAttribute("aria-invalid", "true");
  await discount.press("Enter");
  await expect(discount).toBeFocused();
  await discount.fill("0");
  await discount.press("Shift+Enter");
  await expect(discount).toBeFocused();
  await page.locator("#quick-person-1").fill("1");
  await page.getByRole("combobox", { name: "Siapa yang bayar" }).press("Enter");
  await expect(page.getByRole("button", { name: "Lihat Hasil" })).toBeDisabled();
  await expect(page).toHaveURL(/\/split$/);
});

test("maximum bill downloads as one long PNG with a scrollable preview", async ({ page }, testInfo) => {
  await seedBill(page, largeBill());
  await page.goto("/result");
  await page.getByRole("button", { name: "Struk semua orang" }).click();
  const dialog = page.getByRole("dialog");
  const download = page.getByRole("button", { name: "Download PNG" });
  await expect(download).toBeEnabled();
  const image = dialog.getByRole("img", { name: "Pratinjau struk Semua orang" });
  await expect(image).toHaveJSProperty("naturalWidth", 1080);
  await expect(image).toHaveJSProperty("naturalHeight", 13613);
  await expect(dialog.getByRole("button", { name: /ZIP|halaman/i })).toHaveCount(0);
  const preview = dialog.getByRole("region");
  expect(await preview.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await preview.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await preview.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(download).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("long-receipt.png") });
  const downloaded = page.waitForEvent("download");
  await download.click();
  expect(await pngDimensions(await downloaded)).toEqual({ width: 1080, height: 13613 });

  await page.getByRole("button", { name: "Tutup pratinjau struk" }).click();
  await page.getByRole("button", { name: "Lihat struk Orang 1", exact: true }).click();
  await expect(download).toBeEnabled();
  await expect(dialog.getByRole("img", { name: "Pratinjau struk Orang 1", exact: true })).toHaveJSProperty("naturalHeight", 1747);
  const personal = page.waitForEvent("download");
  await download.click();
  expect(await pngDimensions(await personal)).toEqual({ width: 1080, height: 1747 });
});

test("unsupported sharing downloads a single PNG instead of ZIP", async ({ page }) => {
  await seedBill(page, largeBill());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
  });
  await page.goto("/result");
  await page.getByRole("button", { name: "Struk semua orang" }).click();
  const share = page.getByRole("button", { name: "Share gambar" });
  await expect(share).toBeEnabled();
  const downloaded = page.waitForEvent("download");
  await share.click();
  expect(await pngDimensions(await downloaded)).toEqual({ width: 1080, height: 13613 });
  await expect(page.getByRole("status")).toHaveText("Share gambar belum didukung. PNG sudah diunduh.");
});

test("native sharing sends exactly one PNG and cancellation does not download", async ({ page }) => {
  await seedBill(page, quickBill());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: ({ files }: ShareData) => files?.length === 1 && files[0].type === "image/png" });
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("Cancelled", "AbortError"); } });
  });
  const downloads: Download[] = [];
  page.on("download", (download) => downloads.push(download));
  await page.goto("/result");
  await page.getByRole("button", { name: "Struk semua orang" }).click();
  const share = page.getByRole("button", { name: "Share gambar" });
  await expect(share).toBeEnabled();
  await share.click();
  await expect(share).toBeEnabled();
  await expect(page.getByRole("dialog").getByRole("status")).toHaveCount(0);
  expect(downloads).toHaveLength(0);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async ({ files }: ShareData) => {
      if (files?.length !== 1 || files[0].type !== "image/png" || !files[0].name.endsWith(".png")) throw new Error("Expected one PNG");
    } });
  });
  await share.click();
  await expect(page.getByRole("status")).toHaveText("Struk siap dibagikan.");
  expect(downloads).toHaveLength(0);
});
