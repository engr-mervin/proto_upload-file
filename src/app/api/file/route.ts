import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { join } from "node:path";
import { stat, mkdir, writeFile } from "node:fs/promises";
import * as dateFn from "date-fns";
import mime from "mime";

type NextApiRequestWithFormData = NextApiRequest &
  Request & {
    files: any[];
  };

type NextApiResponseCustom = NextApiResponse & Response;

export async function POST(
  req: NextApiRequestWithFormData,
  res: NextApiResponseCustom
) {
  const formData = await req.formData();
  const image = formData.get("myImage") as Blob | null;

  if (!image)
    return NextResponse.json(
      { error: "Invalid file uploaded." },
      { status: 400 }
    );

  const buffer = Buffer.from(await image.arrayBuffer());
  const relativeUploadDir = `/uploads`;
  const uploadDir = join(process.cwd(), "public", relativeUploadDir);

  try {
    await stat(uploadDir);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error(
        "Error while trying to create directory when uploading a file\n",
        e
      );
      return NextResponse.json(
        { error: "Something went wrong." },
        { status: 500 }
      );
    }
  }

  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${image.name.replace(
      /\.[^/.]+$/,
      ""
    )}-${uniqueSuffix}.${mime.getExtension(image.type)}`;
    await writeFile(`${uploadDir}/${filename}`, buffer);
    return NextResponse.json({ fileUrl: `${relativeUploadDir}/${filename}` });
  } catch (e) {
    console.error("Error while trying to upload a file\n", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
