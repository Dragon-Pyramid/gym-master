import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_CLOUD_API_KEY ||
  !process.env.CLOUDINARY_CLOUD_API_SECRET
) {
  console.error("Faltan las variables de entorno de Cloudinary");
  throw new Error("Faltan las variables de entorno de Cloudinary");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
});

export async function uploadFileCloudinary(
  buffer: Buffer,
  originalName: string,
  folder: string
): Promise<string> {
  const result = await uploadFileCloudinaryWithResult(buffer, originalName, folder);
  return result.secure_url ?? "";
}

export async function uploadFileCloudinaryWithResult(
  buffer: Buffer,
  originalName: string,
  folder: string
): Promise<UploadApiResponse> {
  const timestamp = Date.now();
  const safeOriginalName = originalName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  const options: UploadApiOptions = {
    folder,
    public_id: `${timestamp}_${safeOriginalName || "gym-master-file"}`,
    resource_type: "auto",
    overwrite: false,
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result) {
        reject(new Error("Cloudinary no devolvió resultado de carga."));
        return;
      }

      resolve(result);
    });

    stream.write(buffer);
    stream.end();
  });
}
