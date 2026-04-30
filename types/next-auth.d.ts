import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      userType: "admin" | "socio" | "usuario";
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    userType: "admin" | "socio" | "usuario";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    userType: "admin" | "socio" | "usuario";
  }
}
