import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import User from '@/models/User.js';
import {
  verifyPassword,
  createSessionToken,
  getSessionCookieOptions,
} from '@/lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Server-side validation
    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json(
        { error: 'Username or email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedIdentifier = username.trim().toLowerCase();

    // Find user by username or email, including password field
    const user = await User.findOne({
      $or: [
        { username: normalizedIdentifier },
        { email: normalizedIdentifier },
      ],
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account is disabled. Please contact an administrator.' },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Create session token
    const sessionPayload = {
      sub: user._id.toString(),
      name: user.name,
      username: user.username,
      role: user.role,
    };

    const token = await createSessionToken(sessionPayload);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });

    response.cookies.set({
      ...cookieOptions,
      value: token,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
