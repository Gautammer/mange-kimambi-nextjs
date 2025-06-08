import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt, encryptResponse, encryptError } from '@/lib/crypto';
import { verifyPassword, createAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // TEMPORARILY DISABLED: Validate client key
    // TODO: Re-enable once OAuth clients are created in database
    /*
    const clientKey = request.headers.get('key');
    if (!clientKey) {
      return NextResponse.json(encryptError('Client key required'), { status: 401 });
    }

    const client = await validateClientKey(clientKey);
    if (!client) {
      return NextResponse.json(encryptError('Invalid client'), { status: 401 });
    }
    */
    
    // Temporary mock client for development
    const client = { id: BigInt(1) };

    // Parse request body
    const body = await request.json();
    const email = decrypt(body.email) as string;
    const password = decrypt(body.password) as string;

    if (!email || !password) {
      return NextResponse.json(encryptError('Invalid credentials'), { status: 401 });
    }

    // Check if input is email or username
    const isEmail = email.includes('@');
    
    // Find user
    const user = await prisma.user.findFirst({
      where: isEmail 
        ? { email: email }
        : { username: email }
    });

    if (!user) {
      return NextResponse.json(
        encryptError(`Invalid ${isEmail ? 'Email' : 'Username'} or Password`), 
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        encryptError(`Invalid ${isEmail ? 'Email' : 'Username'} or Password`), 
        { status: 401 }
      );
    }

    // Check if user is allowed to login
    if (user.login === 'Restrict') {
      return NextResponse.json(encryptError('Account restricted'), { status: 401 });
    }

    if (user.status === 'Banned') {
      return NextResponse.json(encryptError('Account banned'), { status: 401 });
    }

    // Update user login status
    await prisma.user.update({
      where: { id: user.id },
      data: { login: 'Restrict' }
    });

    // Revoke existing tokens
    await prisma.oauthAccessToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true }
    });

    // Create new access token
    const token = await createAccessToken(user.id, client.id);

    // Check if app is free
    const sysConfig = await prisma.sysConfig.findFirst();
    if (sysConfig?.appType === 'Free') {
      user.isSubscribed = 'true';
    }

    // Check subscription expiry
    if (user.endOfSubscriptionDate && new Date(user.endOfSubscriptionDate) < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isSubscribed: 'false',
          endOfSubscriptionDate: null
        }
      });
      user.isSubscribed = 'false';
    }

    return NextResponse.json({
      success: true,
      token: encryptResponse({ token }).data,
      user: encryptResponse(user).data
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(encryptError('Server error'), { status: 500 });
  }
} 