import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import { join } from "node:path";
import { stat, mkdir } from "node:fs/promises";
import mime from "mime";
import { createWriteStream, readFileSync, writeFile } from "node:fs";
// import { createClient } from "@supabase/supabase-js";

type NextApiRequestWithFormData = NextApiRequest &
  Request & {
    files: any[];
  };

let data = JSON.parse(
  readFileSync(join(process.cwd(), "public", "data.json"), "utf-8")
);

export async function POST(req: NextApiRequestWithFormData) {
  const formData = await req.formData();
  const image = formData.get("myImage") as File;
  const description = formData.get("myDescription") as string;
  console.log(req);

  if (!image)
    return NextResponse.json(
      { error: "Invalid file uploaded." },
      { status: 400 }
    );

  const relativeUploadDir = `uploads`;
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

    const fileStream = createWriteStream(`${uploadDir}/${filename}`);
    const buffer = Buffer.from(await image.arrayBuffer());
    fileStream.write(buffer);
    fileStream.end();

    console.log("Started stream");
    await new Promise<void>((resolve, reject) => {
      fileStream.on("close", () => {
        console.log("Stream finished");
        resolve();
      });
      fileStream.on("error", (err) => {
        console.log("Stream error");
        reject(err);
      });
    });

    console.log("Finished stream");

    const newFileData = {
      description: description,
      file_url: `${relativeUploadDir}/${filename}`,
    };

    data.files.push(newFileData);
    // writeFile(
    //   join(process.cwd(), "public", "data.json"),
    //   JSON.stringify(data),
    //   (err) => {
    //     if (err) {
    //       return NextResponse.json({
    //         status: 500,
    //         message: "Something went wrong while writing data.",
    //         error: err,
    //       });
    //     } else {
    //       return NextResponse.json({
    //         status: 201,
    //         fileUrl: `${relativeUploadDir}/${filename}`,
    //       });
    //     }
    //   }
    // );

    await new Promise<void>((resolve, reject) => {
      writeFile(
        join(process.cwd(), "public", "data.json"),
        JSON.stringify(data),
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    return NextResponse.json({
      status: 201,
      fileUrl: `${relativeUploadDir}/${filename}`,
    });
  } catch (e) {
    console.error("Error while trying to upload a file\n", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
