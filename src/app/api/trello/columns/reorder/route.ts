import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/trello/columns/reorder - Reorder columns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { columnId, overColumnId } = body;

    if (!columnId || !overColumnId) {
      return NextResponse.json({ error: 'Column IDs are required' }, { status: 400 });
    }

    const columns = await db.column.findMany({
      orderBy: { position: 'asc' },
    });

    const activeIndex = columns.findIndex(c => c.id === columnId);
    const overIndex = columns.findIndex(c => c.id === overColumnId);

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return NextResponse.json({ success: true });
    }

    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(activeIndex, 1);
    newColumns.splice(overIndex, 0, movedColumn);

    // Update positions in database
    await Promise.all(
      newColumns.map((column, index) =>
        db.column.update({
          where: { id: column.id },
          data: { position: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering columns:', error);
    return NextResponse.json({ error: 'Failed to reorder columns' }, { status: 500 });
  }
}
