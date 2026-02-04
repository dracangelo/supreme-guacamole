import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/trello/columns - Get all columns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    const columns = await db.column.findMany({
      where: boardId ? { boardId } : undefined,
      orderBy: { position: 'asc' },
    });
    return NextResponse.json(columns);
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
  }
}

// POST /api/trello/columns - Create a new column
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, position, boardId } = body;

    if (!title || !boardId) {
      return NextResponse.json({ error: 'Title and boardId are required' }, { status: 400 });
    }

    const column = await db.column.create({
      data: {
        title,
        position: position ?? 0,
        boardId,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
