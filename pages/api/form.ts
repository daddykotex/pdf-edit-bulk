import { NextApiRequest, NextApiResponse } from "next";
import { createReadStream, ReadStream } from "fs";
import { IncomingForm, Files, Fields, File as FFile } from "formidable";

async function parseForm(req: NextApiRequest): Promise<Files> {
  const form = new IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields: Fields, files: Files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
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

type Result = { streamHandle: () => ReadStream; fileName: string };

function process(req: NextApiRequest): Promise<Result> {
  return parseForm(req)
    .then((files) => extractFile(files))
    .then((file) => {
      return {
        streamHandle: () => createReadStream(file.path),
        fileName: `${file.name}-updated`,
      };
    });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

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
