import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

interface PdfExtractionOptions {
  onStatus?: (message: string) => void;
}

interface PdfExtractionResult {
  text: string;
  method: "text" | "ocr";
  ocrPages: number;
}

let pdfLoaderPromise:
  | Promise<{
      getDocument: typeof import("pdfjs-dist")["getDocument"];
    }>
  | null = null;

let tesseractLoaderPromise:
  | Promise<{
      createWorker: typeof import("tesseract.js")["createWorker"];
    }>
  | null = null;

const OCR_RENDER_SCALE = 2;
const OCR_FALLBACK_PAGES = 1;
const MIN_MEANINGFUL_WORDS = 4;
const MIN_MEANINGFUL_CHARACTERS = 20;

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

const loadTesseract = async () => {
  if (!tesseractLoaderPromise) {
    tesseractLoaderPromise = import("tesseract.js").then(({ createWorker }) => ({
      createWorker,
    }));
  }

  return tesseractLoaderPromise;
};

const emitStatus = (onStatus: PdfExtractionOptions["onStatus"], message: string) => {
  onStatus?.(message);
};

const normalizePageText = (value: string) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const hasMeaningfulText = (value: string) => {
  const normalized = normalizePageText(value);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const characterCount = normalized.replace(/[^a-z0-9]+/gi, "").length;

  return wordCount >= MIN_MEANINGFUL_WORDS || characterCount >= MIN_MEANINGFUL_CHARACTERS;
};

const extractTextLayerFromPdf = async (
  pdf: PDFDocumentProxy,
  onStatus: PdfExtractionOptions["onStatus"],
) => {
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    emitStatus(onStatus, `Extracting text from PDF page ${pageNumber} of ${pdf.numPages}...`);

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

  return pageTexts.join("\n\n");
};

const renderPdfPageToCanvas = async (page: PDFPageProxy) => {
  const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare PDF OCR rendering.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({
    canvas,
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
};

const extractTextFromCanvasWithOcr = async (
  canvas: HTMLCanvasElement,
  pageNumber: number,
  totalPages: number,
  onStatus: PdfExtractionOptions["onStatus"],
) => {
  const { createWorker } = await loadTesseract();
  const worker = await createWorker("eng", undefined, {
    logger: (message) => {
      if (message.status) {
        const percent = Math.round((message.progress ?? 0) * 100);
        emitStatus(
          onStatus,
          `Running OCR on page ${pageNumber} of ${totalPages}: ${message.status}${Number.isFinite(percent) ? ` ${percent}%` : ""}`,
        );
      }
    },
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    const result = await worker.recognize(canvas);
    return normalizePageText(result.data.text);
  } finally {
    await worker.terminate();
  }
};

const extractTextFromPdfWithOcr = async (
  pdf: PDFDocumentProxy,
  onStatus: PdfExtractionOptions["onStatus"],
) => {
  const pageTexts: string[] = [];
  const pagesToProcess = Math.min(pdf.numPages, OCR_FALLBACK_PAGES);

  for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const canvas = await renderPdfPageToCanvas(page);

    try {
      const pageText = await extractTextFromCanvasWithOcr(
        canvas,
        pageNumber,
        pagesToProcess,
        onStatus,
      );

      if (pageText) {
        pageTexts.push(pageText);
      }
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }
  }

  return pageTexts.join("\n\n");
};

export const extractTextFromPdfFile = async (
  file: File,
  options: PdfExtractionOptions = {},
): Promise<PdfExtractionResult> => {
  emitStatus(options.onStatus, "Reading PDF...");

  const buffer = await file.arrayBuffer();
  const { getDocument } = await loadPdfJs();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;

  try {
    const extractedText = await extractTextLayerFromPdf(pdf, options.onStatus);

    if (hasMeaningfulText(extractedText)) {
      return {
        text: extractedText,
        method: "text",
        ocrPages: 0,
      };
    }

    emitStatus(
      options.onStatus,
      "No readable PDF text layer was found. Running OCR on the first page...",
    );

    const ocrText = await extractTextFromPdfWithOcr(pdf, options.onStatus);

    if (!hasMeaningfulText(ocrText)) {
      throw new Error(
        "We could not extract readable text from that PDF. Try another file or paste the text manually.",
      );
    }

    return {
      text: ocrText,
      method: "ocr",
      ocrPages: Math.min(pdf.numPages, OCR_FALLBACK_PAGES),
    };
  } finally {
    pdf.destroy();
  }
};
