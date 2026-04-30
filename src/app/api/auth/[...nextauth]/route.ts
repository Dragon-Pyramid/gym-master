import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "Tipo de usuario", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const requestedUserType = (credentials?.userType as string) || "";

        if (!email || !password) {
          throw new Error(
            "Credenciales incompletas: Email y contraseña son obligatorios."
          );
        }

        const {
          data: { user },
          error: signInError,
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError || !user) {
          throw new Error(
            "Credenciales inválidas: Correo o contraseña incorrectos."
          );
        }

        const { data: userData, error: fetchError } = await supabase
          .from("usuario")
          .select("id, nombre, email, rol")
          .eq("email", email)
          .single();

        if (fetchError || !userData) {
          throw new Error(
            "Datos de perfil de usuario no encontrados en la base de datos."
          );
        }

        // Corrección: Definir explícitamente el tipo de finalUserType
        let finalUserType: "admin" | "socio" | "usuario";

        if (userData.rol === "admin") {
          if (
            requestedUserType === "admin" ||
            requestedUserType === "socio" ||
            requestedUserType === "usuario"
          ) {
            finalUserType = requestedUserType;
          } else {
            // Si el requestedUserType no es válido, por defecto lo establecemos a 'admin'
            finalUserType = "admin";
          }
        } else {
          // Aseguramos que userData.rol es uno de los tipos esperados para la asignación
          if (userData.rol === "socio" || userData.rol === "usuario") {
            if (userData.rol !== requestedUserType) {
              throw new Error(
                `Tipo de usuario incorrecto. Rol de DB (${userData.rol}) no coincide con el tipo solicitado (${requestedUserType}).`
              );
            }
            finalUserType = userData.rol;
          } else {
            // Caso inesperado donde el rol de la DB no es 'admin', 'socio' o 'usuario'.
            throw new Error("Rol de usuario inválido en la base de datos.");
          }
        }

        return {
          id: user.id,
          email: userData.email,
          name: userData.nombre,
          userType: finalUserType,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.userType = token.userType as "admin" | "socio" | "usuario";
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
