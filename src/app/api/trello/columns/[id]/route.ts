import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/trello/columns/[id] - Update a column
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title } = body;

    const column = await db.column.update({
      where: { id: params.id },
      data: { title },
    });

    return NextResponse.json(column);
  } catch (error) {
    console.error('Error updating column:', error);
    return NextResponse.json({ error: 'Failed to update column' }, { status: 500 });
  }
}

// DELETE /api/trello/columns/[id] - Delete a column and all its tasks
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.column.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting column:', error);
    return NextResponse.json({ error: 'Failed to delete column' }, { status: 500 });
  }
}
