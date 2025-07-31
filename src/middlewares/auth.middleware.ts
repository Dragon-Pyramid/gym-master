import { JwtUser } from '@/interfaces/jwtUser.interface';
import * as jwt  from 'jsonwebtoken';

export async function authMiddleware(req: Request) : Promise<{ user: JwtUser }> {
    const token = req.headers.get("authorization")?.split(' ')[1];
    
    if (!token) {
     throw new Error("Token no proporcionado");
   }
    
    if(!process.env.JWT_SECRET){
        throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || typeof decoded === 'string') {
        throw new Error("Token inválido");
    }
    const user: JwtUser = decoded as JwtUser;
    return { user };

    }
