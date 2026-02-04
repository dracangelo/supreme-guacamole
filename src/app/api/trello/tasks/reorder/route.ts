import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/trello/tasks/reorder - Reorder tasks within same column
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, overTaskId } = body;

    if (!taskId || !overTaskId) {
      return NextResponse.json({ error: 'Task IDs are required' }, { status: 400 });
    }

    const activeTask = await db.task.findUnique({ where: { id: taskId } });
    const overTask = await db.task.findUnique({ where: { id: overTaskId } });

    if (!activeTask || !overTask || activeTask.id === overTask.id) {
      return NextResponse.json({ success: true });
    }

    // Get all tasks in the same column
    const tasks = await db.task.findMany({
      where: { columnId: overTask.columnId },
      orderBy: { position: 'asc' },
    });

    const activeIndex = tasks.findIndex(t => t.id === activeTask.id);
    const overIndex = tasks.findIndex(t => t.id === overTask.id);

    let newTasks;
    if (activeTask.columnId === overTask.columnId) {
      // Reordering within same column
      newTasks = [...tasks];
      newTasks.splice(activeIndex, 1);
      newTasks.splice(overIndex, 0, activeTask);
    } else {
      // Moving from another column - this shouldn't happen with reorder endpoint
      // But we'll handle it gracefully
      newTasks = [...tasks];
      newTasks.push(activeTask);
    }

    // Update positions in database
    await Promise.all(
      newTasks.map((task, index) =>
        db.task.update({
          where: { id: task.id },
          data: { position: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
