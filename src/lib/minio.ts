// src/libs/minio.ts
import { Client, S3Error } from "minio";

const minioBucket = process.env.MINIO_BUCKET || "bucket";
const minioEndpoint = process.env.MINIO_ENDPOINT || "localhost";
const minioPort = Number(process.env.MINIO_PORT ?? "9000");
const minioUseSSL = process.env.MINIO_USE_SSL === "yes";
const minioAccessKey = process.env.MINIO_ACCESS_KEY;
const minioSecretKey = process.env.MINIO_SECRET_KEY;

export const minioClient = new Client({
  endPoint: minioEndpoint,
  port: minioPort,
  useSSL: minioUseSSL,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
  partSize: 8 * 1024 * 1024,
});

// Upload a file to MinIO
export const uploadFileToMinIO = async (
  objectName: string,
  fileBuffer: Buffer
): Promise<string> => {
  try {
    //if file size is greater than 1 MB, use multipart upload

    await minioClient.putObject(minioBucket, objectName, fileBuffer);

    return `${minioEndpoint}:${minioPort}/${minioBucket}/${objectName}`;
  } catch (e: any) {
    console.log(`Error Uploading File: ${e}`);
    if (e instanceof S3Error) {
     console.log(`Error Uploading File: ${e}`);
    }
    throw e;
  }
};

export const generatePresignedUrl = async (
  objectName: string,
  expirySeconds: number = 3600 // 1 hour default
): Promise<string> => {
  try {
    const url = await minioClient.presignedGetObject(
      minioBucket,
      objectName,
      expirySeconds
    );
    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw error;
  }
};

export const getFile = async (
  objectName: string
): Promise<NodeJS.ReadableStream> => {
  try {
    const readable = await minioClient.getObject(minioBucket, objectName);
    return readable;
  } catch (error) {
    console.error("Error fetching object from MinIO:", error);
    throw error;
  }
};
