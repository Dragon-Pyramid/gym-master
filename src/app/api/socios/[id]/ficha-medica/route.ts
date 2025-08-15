
import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { createFichaMedicaSocio } from "@/services/fichaMedicaService";
import { FileUploadDTO } from "@/interfaces/fileUpload.interface";

export async function POST(req: Request, {params} : {params: {id:string}}) {
    try{
    const {user} = await authMiddleware(req);
    if(!user){
        return NextResponse.json({error: "Usuario no autorizado"}, {status: 401});
    }

    const {id} = params;

      if (!id) {
        return NextResponse.json({error: "ID de socio no proporcionado"}, {status: 400});
    }

    const formdata = await req.formData();
   const fichaRaw = formdata.get("ficha");
    const file = formdata.get("file") as File;

       if (!fichaRaw) {
           return new Response("No se encuentra la ficha", { status: 400 });
       }
       if (!file) {
           return new Response("No se encuentra el archivo file", { status: 400 });
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

    
   const ficha = JSON.parse(fichaRaw.toString());


    const fichaMedica = await createFichaMedicaSocio(user, id, ficha, fileDto);

    return NextResponse.json({message:"ficha cargada con exito", data: fichaMedica}, {status: 201});

    }catch(error:any){
        console.log(error);
        return NextResponse.json({error: error.message}, {status: 500});
        
    }
}