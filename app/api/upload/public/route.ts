import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";
import crypto from "crypto";
import { withSecurity } from "@/lib/api-handler";

async function publicUploadHandler(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and contentType are required" },
        { status: 400 }
      );
    }

    const uniqueId = crypto.randomBytes(16).toString("hex");
    const fileExtension = filename.split(".").pop();
    // Using a public-uploads prefix to separate from active user uploads
    const key = `public-uploads/${uniqueId}.${fileExtension}`;

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
      url: publicUrl,
      key,
    });
  } catch (error) {
    console.error("Presigned URL error (Public):", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withSecurity(publicUploadHandler, { limit: 50 }); // Increased for file uploads
