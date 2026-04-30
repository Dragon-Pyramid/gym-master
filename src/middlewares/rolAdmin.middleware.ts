import { JwtUser } from "@/interfaces/jwtUser.interface";

export function rolAdminMiddleware(user: JwtUser) {
    if (!user || user.rol !== 'admin') {
        throw new Error("Unauthorized: User no tiene rol de admin");
    }
    return true;
}
