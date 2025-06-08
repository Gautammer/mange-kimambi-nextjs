import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt, encryptResponse, encryptError } from '@/lib/crypto';
import { hashPassword, createAccessToken, validateClientKey } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate client key
    const clientKey = request.headers.get('key');
    if (!clientKey) {
      return NextResponse.json(encryptError('Client key required'), { status: 401 });
    }

    const client = await validateClientKey(clientKey);
    if (!client) {
      return NextResponse.json(encryptError('Invalid client'), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const username = decrypt(body.username) as string;
    const password = decrypt(body.password) as string;
    const gender = decrypt(body.gender) as string | null;
    const email = body.email ? decrypt(body.email) as string : null;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        encryptError('Username and password are required'), 
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        encryptError(`Username ${username} taken please change`), 
        { status: 400 }
      );
    }

    // Check if email exists
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return NextResponse.json(
          encryptError('Email already registered'), 
          { status: 400 }
        );
      }
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: username,
        email,
        gender: gender as 'Male' | 'Female' | undefined,
        platform: 'App',
      }
    });

    // Create access token
    const token = await createAccessToken(user.id, client.id);

    return NextResponse.json({
      success: true,
      token: encryptResponse({ token }).data,
      user: encryptResponse(user).data
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(encryptError('Server error'), { status: 500 });
  }
} 