import * as jwt  from 'jsonwebtoken';

export async function authMiddleware(req: Request) {
    const token = req.headers.get("authorization")?.split(' ')[1];
    
    if (!token) {
     throw new Error("Token no proporcionado");
   }
    
    if(!process.env.JWT_SECRET){
        throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(!decoded){
        throw new Error("Token inválido");
    }
    return { user: decoded };

    }
