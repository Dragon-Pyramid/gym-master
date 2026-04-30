import {v2 as cloudinary,UploadApiOptions} from "cloudinary"

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_CLOUD_API_KEY || !process.env.CLOUDINARY_CLOUD_API_SECRET) { 
    console.error("Faltan las variables de entorno de Cloudinary");
    throw new Error("Faltan las variables de entorno de Cloudinary");
}

        cloudinary.config({
            cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
            api_key:process.env.CLOUDINARY_CLOUD_API_KEY,
            api_secret:process.env.CLOUDINARY_CLOUD_API_SECRET
        })


    export async function uploadFileCloudinary(buffer:Buffer, originalName:string,folder: string) :Promise<string>{
     const timestamp = Date.now();
        const options: UploadApiOptions = {
        folder: folder,
        public_id: `${timestamp}_${originalName}`,
        RESOURCE_TYPE:"AUTO",
        };
        
        return new Promise( (resolve,reject)=>{
        const stream = cloudinary.uploader.upload_stream(
        options,
        (error,result)=>{
        error? reject(error) : resolve(result? result.secure_url : "");
        },
        );
        stream.write(buffer);
        stream.end();
        } )
        }

        
    
        