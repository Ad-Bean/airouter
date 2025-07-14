import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Authorize called with:', credentials);

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user || !user.password) {
          console.log('No user found or no password');
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          return null;
        }

        console.log('Returning user:', { id: user.id, email: user.email });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'database' as const,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, user }: any) {
      // With database strategy, user object is available directly
      if (user && session?.user) {
        session.user.id = user.id;
        // Fetch the latest user data to get userType
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: { userType: true },
        });
        session.user.userType = userData?.userType || 'free';
      }
      return session;
    },
  },
};
