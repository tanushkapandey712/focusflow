let pdfLoaderPromise:
  | Promise<{
      getDocument: typeof import("pdfjs-dist")["getDocument"];
    }>
  | null = null;

const loadPdfJs = async () => {
  if (!pdfLoaderPromise) {
    pdfLoaderPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]).then(([pdfjs, workerModule]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

      return {
        getDocument: pdfjs.getDocument,
      };
    });
  }

  return pdfLoaderPromise;
};

const normalizePageText = (value: string) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const extractTextFromPdfFile = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const { getDocument } = await loadPdfJs();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageTexts: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lines: string[] = [];
      let lastTransformY: number | null = null;

      textContent.items.forEach((item) => {
        if (!("str" in item)) {
          return;
        }

        const text = item.str.replace(/\s+/g, " ").trim();

        if (!text) {
          return;
        }

        const currentTransformY = item.transform?.[5];
        const lastIndex = lines.length - 1;

        if (
          lastIndex >= 0 &&
          typeof currentTransformY === "number" &&
          lastTransformY !== null &&
          Math.abs(lastTransformY - currentTransformY) < 1.5
        ) {
          lines[lastIndex] = `${lines[lastIndex]} ${text}`.replace(/\s+/g, " ").trim();
        } else {
          lines.push(text);
        }

        lastTransformY = typeof currentTransformY === "number" ? currentTransformY : null;
      });

      const normalizedPageText = normalizePageText(lines.join("\n"));

      if (normalizedPageText) {
        pageTexts.push(normalizedPageText);
      }
    }
  } finally {
    pdf.destroy();
  }

  return pageTexts.join("\n\n");
};
