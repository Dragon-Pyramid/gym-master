import { FileUploadDTO } from "@/interfaces/fileUpload.interface";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { uploadFile } from "@/services/fileUploadService";
import { updateFotoUsuarioById } from "@/services/usuarioService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { user } = await authMiddleware(request);
        if(!user){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json({ error: "No file uploaded"}, { status: 400 });
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

    const folder = `${user.dbName}/${user.rol}/profile`;
    const result = await uploadFile(fileDto, folder);
    if (!result) {
        return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
    }
    await updateFotoUsuarioById(user, result);
    return NextResponse.json({message: "Foto de usuario actualizada", url: result}, { status: 200 });

}catch (error:any) {
    console.error("error file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
}
}
