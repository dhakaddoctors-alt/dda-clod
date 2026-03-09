import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Mobile", type: "text", placeholder: "Email or Mobile Number" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email.trim();
        const db = getDb();

        // Try to find user by email first, then by mobile
        let userResults = await db.select().from(profiles).where(eq(profiles.email, identifier));
        if (userResults.length === 0) {
          userResults = await db.select().from(profiles).where(eq(profiles.mobile, identifier));
        }
        const user = userResults.length > 0 ? (userResults[0] as any) : null;

        if (!user) {
          return null;
        }

        const storedHash = user.passwordHash;
        if (!storedHash) return null;

        const isValid = await bcrypt.compare(credentials.password, storedHash);
        if (!isValid) return null;

        return { 
          id: user.id, 
          name: user.fullName, 
          email: user.email, 
          role: user.role,
          avatarUrl: user.avatarUrl,
          state: user.state,
          district: user.district
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1 year session duration
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.state = (user as any).state;
        token.district = (user as any).district;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).state = token.state;
        (session.user as any).district = token.district;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
