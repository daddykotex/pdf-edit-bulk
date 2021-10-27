import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Files, Fields, File as FFile } from "formidable";
import { parseFile, CsvParserStream } from "fast-csv";
import { Row } from "@fast-csv/parse";
import {
  PDFDocument,
  PDFName,
  PDFOperator,
  PDFRawStream,
  PDFStream,
  PDFString,
  rgb,
} from "pdf-lib";
import { readFile } from "fs/promises";

type CSVData = {
  id: string;
  qty: number;
};

function extractValue(f: Fields, key: string): string {
  const value: string | string[] = f[key];
  if (Array.isArray(value)) {
    return value.join(" ");
  } else {
    return value;
  }
}

async function parseForm(
  req: NextApiRequest
): Promise<{ files: Files; options: Options }> {
  const form = new IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields: Fields, files: Files) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          files,
          options: {
            project: extractValue(fields, "project"),
            prefix: extractValue(fields, "prefix"),
          },
        });
      }
    });
  });
}

function extractFile(files: Files, key: "csv" | "pdf"): Promise<FFile> {
  let firstFile: FFile | undefined;
  const temp = files[key];
  if (temp) {
    if (Array.isArray(temp)) {
      if (temp.length >= 0) {
        firstFile = temp[0];
      }
    } else {
      firstFile = temp;
    }
  }

  if (!firstFile) {
    return Promise.reject({
      code: 302,
      loc: "/?error=file_not_found",
    });
  }

  return Promise.resolve(firstFile);
}

function loadPdf(filePath: string): Promise<PDFDocument> {
  return readFile(filePath).then((bytes) => PDFDocument.load(bytes));
}

async function loadCsv(filePath: string) {
  async function csvIntoArray(
    stream: CsvParserStream<Row, Row>
  ): Promise<Array<CSVData>> {
    return new Promise((resolve, reject) => {
      const rows: Array<CSVData> = [];
      stream
        .on("data", (data) => {
          const id = data["Item ULC"];
          const qty = parseInt(data["Qty"].trim(), 10);
          rows.push({ id, qty });
        })
        .on("end", () => {
          resolve(rows);
        })
        .on("error", (error) => reject(error));
    });
  }

  const stream = parseFile(filePath, { headers: true });
  return await csvIntoArray(stream);
}

type Options = { prefix: string; project: string };

function applyTransformation(
  doc: PDFDocument,
  options: Options,
  data: Array<CSVData>
) {
  const pages = doc.getPages();
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    const { width, height } = page.getSize();

    const pageNo = String(index + 1).padStart(3, "0");
    const rotated =
      page.getRotation().angle === 90 && page.getRotation().type === "degrees";

    const pieceId = `${options.project}-${pageNo}`;

    const found = data.find(
      ({ id }) => id.toLocaleLowerCase() === pieceId.toLocaleLowerCase()
    );
    console.log(found, pieceId);
    const qtyS = found !== undefined ? `Qty: ${found.qty}` : "";
    const theText = `${options.prefix}${pieceId} ${qtyS}`;

    const minPadding = 5;
    const toLeft = minPadding + theText.length * 10;

    let x, y: number;
    if (rotated) {
      x = 15;
      y = height - toLeft;
    } else {
      x = width - toLeft;
      y = height - 15;
    }

    page.drawText(theText, {
      x,
      y,
      rotate: page.getRotation(),
      size: 15,
      color: rgb(0, 0, 0),
    });
  }
}

type Result = {
  pdfBytes: () => Promise<Uint8Array>;
  fileName: string;
};

async function process(req: NextApiRequest): Promise<Result> {
  const { files, options } = await parseForm(req);
  const pdf = await extractFile(files, "pdf");
  const csv = await extractFile(files, "csv");
  const doc = await loadPdf(pdf.path);
  const data = await loadCsv(csv.path);

  applyTransformation(doc, options, data);

  return {
    pdfBytes: () => doc.save(),
    fileName: `result.pdf`,
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  return process(req)
    .then((result) => {
      return result.pdfBytes().then((pdfBytes) => {
        res.writeHead(200, {
          "Content-disposition": `attachment; filename="${result.fileName}"`,
          "Content-Type": "application/pdf",
        });
        res.end(Buffer.from(pdfBytes));
        return;
      });
    })
    .catch((err) => {
      if (err.code && err.loc) {
        console.log("Not found");
        res.writeHead(err.code, {
          Location: err.loc,
        });
        res.end();
      } else {
        console.error(err);
        res.writeHead(500);
        res.end("Oops");
      }
    });
};
