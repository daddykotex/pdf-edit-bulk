import { NextApiRequest, NextApiResponse } from "next";
import { createReadStream, ReadStream } from "fs";
import formidable from "formidable";

async function parseForm(req: NextApiRequest): Promise<formidable.Files> {
  const form = formidable();
  return new Promise((resolve, reject) => {
    form.parse(
      req,
      (err: Error, fields: formidable.Fields, files: formidable.Files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      }
    );
  });
}

async function extractFile(files: formidable.Files): Promise<formidable.File> {
  console.log("wtf");
  let firstFile: formidable.File | undefined;
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

  return firstFile;
}

type Result = { streamHandle: () => ReadStream; fileName: string };

async function process(req: NextApiRequest): Promise<Result> {
  return parseForm(req)
    .then((files) => extractFile(files))
    .then((file) => {
      return {
        streamHandle: () => createReadStream(file.path),
        fileName: `${file.name}-updated`,
      };
    });
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  return process(req)
    .then((result) => {
      const stream = result.streamHandle();
      res.writeHead(200, {
        "Content-disposition": `attachment; filename="${result.fileName}"`,
        "Content-Type": "application/pdf",
      });
      stream.pipe(res);
      return;
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
