import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and contentType are required" },
        { status: 400 }
      );
    }


    const uniqueId = crypto.randomBytes(16).toString("hex");
    const fileExtension = filename.split(".").pop();
    const key = `${session.userId}/${uniqueId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL valid for 5 minutes
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    // The public URL where the image will be accessible after upload
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
