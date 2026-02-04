import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from '@/lib/activity-logger';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const board = await db.board.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Log the activity
    if (board.organizationId) {
      const organization = await db.organization.findUnique({
        where: { id: board.organizationId },
      });

      await logActivity({
        action: ACTIVITY_TYPES.UPDATED,
        entityType: ENTITY_TYPES.BOARD,
        entityId: board.id,
        userId: organization?.ownerId || '',
        organizationId: board.organizationId,
        boardId: board.id,
        details: `Updated board${name ? ' "' + name + '"' : ''}`,
      });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Failed to update board:', error);
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const board = await db.board.findUnique({
      where: { id: params.id },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // First, delete all tasks in columns of this board
    const columns = await db.column.findMany({
      where: { boardId: params.id },
    });

    for (const column of columns) {
      await db.task.deleteMany({
        where: { columnId: column.id },
      });
    }

    // Delete all columns of this board
    await db.column.deleteMany({
      where: { boardId: params.id },
    });

    // Delete the board
    await db.board.delete({
      where: { id: params.id },
    });

    // Log the activity
    await logActivity({
      action: ACTIVITY_TYPES.DELETED,
      entityType: ENTITY_TYPES.BOARD,
      entityId: board.id,
      userId: board.organizationId,
      organizationId: board.organizationId,
      boardId: board.id,
      details: `Deleted board "${board.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete board:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
