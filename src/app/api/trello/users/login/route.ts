import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/trello/users/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let user = await db.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create a new one
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: 'user',
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
