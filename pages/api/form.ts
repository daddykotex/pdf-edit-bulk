import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Files, Fields, File as FFile } from "formidable";
import { PDFDocument, rgb } from "pdf-lib";
import { readFile } from "fs/promises";

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
        let project: string;
        if (fields.project instanceof Array) {
        } else {
          fields.pro;
        }
        resolve({
          files,
          options: { project: extractValue(fields, "project") },
        });
      }
    });
  });
}

function extractFile(files: Files): Promise<FFile> {
  let firstFile: FFile | undefined;
  const temp = Object.values(files)[0];
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

function loadUploadedFile(filePath: string): Promise<PDFDocument> {
  return readFile(filePath).then((bytes) => PDFDocument.load(bytes));
}

type Options = { project: string };

function applyTransformation(doc: PDFDocument, options: Options) {
  const pages = doc.getPages();
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    const { width, height } = page.getSize();

    const pageNo = String(index + 1).padStart(3, "0");

    const theText = `${options.project}-${pageNo}`;
    page.drawText(theText, {
      x: width - 100,
      y: height - 25,
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
  const file = await extractFile(files);
  const doc = await loadUploadedFile(file.path);

  applyTransformation(doc, options);

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
