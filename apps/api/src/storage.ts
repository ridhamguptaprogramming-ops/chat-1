import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { config } from "./config.js";

const s3 = new S3Client({ region: config.AWS_REGION });

type UploadInput = {
  fileName: string;
  mimeType: string;
  byteSize: number;
};

export async function createUploadUrl(userId: string, input: UploadInput) {
  if (!config.S3_BUCKET) {
    throw new Error("S3_BUCKET is not configured");
  }

  const extension = input.fileName.includes(".") ? input.fileName.split(".").pop() : "bin";
  const key = `users/${userId}/${uuid()}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key,
    ContentType: input.mimeType,
    ContentLength: input.byteSize
  });

  return {
    key,
    uploadUrl: await getSignedUrl(s3, command, { expiresIn: 60 * 5 })
  };
}
