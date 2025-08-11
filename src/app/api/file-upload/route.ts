import { FileUploadDTO } from "@/interfaces/fileUpload.interface";
import { uploadFile } from "@/services/fileUploadService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try{
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return new Response("No file uploaded", { status: 400 });
    }
    // Convierto el archivo en un ArrayBuffer y desp en un Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

const fileDto : FileUploadDTO = {
    fieldName: file.name,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    buffer: buffer
};
    const result = await uploadFile(fileDto);

    return NextResponse.json({url:result}, { status: 200 });
    
}catch (error:any) {
    console.error("error file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
}
}
