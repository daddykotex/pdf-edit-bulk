import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  return Promise.resolve(res.status(200).json({ name: 'John Doe' }));
}
