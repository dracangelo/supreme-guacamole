import { db } from '@/lib/db';

export async function logActivity({
  action,
  entityType,
  entityId,
  userId,
  organizationId,
  boardId,
  taskId,
  details,
}: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  organizationId?: string;
  boardId?: string;
  taskId?: string;
  details?: string;
}) {
  try {
    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        entityType,
        entityId,
        userId,
        organizationId,
        boardId,
        taskId,
        details,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export const ACTIVITY_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  MOVED: 'moved',
  COMMENTED: 'commented',
} as const;

export const ENTITY_TYPES = {
  ORGANIZATION: 'organization',
  BOARD: 'board',
  COLUMN: 'column',
  TASK: 'task',
  USER: 'user',
} as const;
