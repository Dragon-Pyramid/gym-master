export function rolAdminMiddleware(user) {
    if (!user || user.role !== 'admin') {
        throw new Error("Unauthorized: User no tiene rol de admin");
    }
    return true;
}
