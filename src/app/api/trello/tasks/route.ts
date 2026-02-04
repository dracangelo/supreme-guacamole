import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/trello/tasks - Get all tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    const tasks = await db.task.findMany({
      where: boardId ? { boardId } : undefined,
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        columnId: true,
        position: true,
        status: true,
        assigneeId: true,
        dueDate: true,
        boardId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/trello/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, columnId, position, status, assigneeId, dueDate, boardId } = body;

    if (!title || !columnId || !boardId) {
      return NextResponse.json({ error: 'Title, columnId, and boardId are required' }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        columnId,
        position: position ?? 0,
        status: status ?? 'todo',
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        boardId,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
