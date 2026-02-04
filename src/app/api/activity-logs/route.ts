import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const boardId = searchParams.get('boardId');
    const taskId = searchParams.get('taskId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (organizationId) where.organizationId = organizationId;
    if (boardId) where.boardId = boardId;
    if (taskId) where.taskId = taskId;

    const activities = await db.activityLog.findMany({
      where,
      include: {
        user: true,
        board: true,
        task: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, entityType, entityId, userId, organizationId, boardId, taskId, details } = body;

    if (!action || !entityType || !entityId || !userId) {
      return NextResponse.json({ error: 'Action, entityType, entityId, and userId are required' }, { status: 400 });
    }

    const activity = await db.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        organizationId: organizationId || null,
        boardId: boardId || null,
        taskId: taskId || null,
        details: details || null,
      },
      include: {
        user: true,
        board: true,
        task: true,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Failed to create activity log:', error);
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}
