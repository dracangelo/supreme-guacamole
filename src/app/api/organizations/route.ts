import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from '@/lib/activity-logger';

export async function GET() {
  try {
    const organizations = await db.organization.findMany({
      include: {
        users: true,
        boards: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json({ error: 'Name and ownerId are required' }, { status: 400 });
    }

    const organization = await db.organization.create({
      data: {
        name,
        description: description || null,
        ownerId,
        boardLimit: 7,
      },
      include: {
        users: true,
      },
    });

    // Log the activity
    await logActivity({
      action: ACTIVITY_TYPES.CREATED,
      entityType: ENTITY_TYPES.ORGANIZATION,
      entityId: organization.id,
      userId: ownerId,
      organizationId: organization.id,
      details: `Created workspace "${name}"`,
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
