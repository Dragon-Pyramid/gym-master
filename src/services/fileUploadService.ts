import { FileUploadDTO } from "@/interfaces/fileUpload.interface";
import { uploadFileCloudinary } from "@/lib/cloudinary";

export const uploadFile = async ( file:FileUploadDTO ) :Promise<string> => {

    if(file.size > 5 * 1024 * 1024) { // 5 MB limite
        throw new Error("File size excede los 5 MB limite.");
    }

    const url = await uploadFileCloudinary(file.buffer,file.originalName);
    return url;
    }
