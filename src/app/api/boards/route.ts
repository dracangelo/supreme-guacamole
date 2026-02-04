import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from '@/lib/activity-logger';

export async function GET() {
  try {
    const boards = await db.board.findMany({
      include: {
        organization: true,
        columns: {
          orderBy: {
            position: 'asc',
          },
          include: {
            tasks: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Failed to fetch boards:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, organizationId } = body;

    if (!name || !organizationId) {
      return NextResponse.json({ error: 'Name and organizationId are required' }, { status: 400 });
    }

    // Check board limit for this organization
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { boards: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (organization._count.boards >= organization.boardLimit) {
      return NextResponse.json(
        { error: `Board limit reached. Maximum ${organization.boardLimit} boards allowed per organization.` },
        { status: 400 }
      );
    }

    const board = await db.board.create({
      data: {
        name,
        description: description || null,
        organizationId,
      },
    });

    // Log the activity
    await logActivity({
      action: ACTIVITY_TYPES.CREATED,
      entityType: ENTITY_TYPES.BOARD,
      entityId: board.id,
      userId: organization.ownerId,
      organizationId,
      boardId: board.id,
      details: `Created board "${name}"`,
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error('Failed to create board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
