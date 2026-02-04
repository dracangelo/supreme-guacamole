import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/trello/tasks/move - Move a task to a different column
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, columnId, position } = body;

    if (!taskId || !columnId) {
      return NextResponse.json({ error: 'Task ID and column ID are required' }, { status: 400 });
    }

    // Update the task's column and position
    const task = await db.task.update({
      where: { id: taskId },
      data: {
        columnId,
        position: position ?? 0,
      },
    });

    // Reorder all tasks in the target column
    const tasks = await db.task.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });

    // Rebuild positions to ensure no gaps
    await Promise.all(
      tasks.map((t, index) =>
        db.task.update({
          where: { id: t.id },
          data: { position: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving task:', error);
    return NextResponse.json({ error: 'Failed to move task' }, { status: 500 });
  }
}
