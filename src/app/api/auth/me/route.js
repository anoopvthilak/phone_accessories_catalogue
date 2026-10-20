import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth.js';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.sub,
      name: session.name,
      username: session.username,
      role: session.role,
    },
  });
}
