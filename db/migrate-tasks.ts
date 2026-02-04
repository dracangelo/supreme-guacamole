import { db } from '@/lib/db';

async function main() {
  console.log('Migrating existing tasks to add new fields...');

  // Get all tasks
  const tasks = await db.task.findMany();

  console.log(`Found ${tasks.length} tasks to migrate`);

  // Update each task with default values for new fields
  for (const task of tasks) {
    await db.task.update({
      where: { id: task.id },
      data: {
        status: task.status || 'todo',
        assigneeId: task.assigneeId || null,
        dueDate: task.dueDate || null,
      },
    });
  }

  console.log('Migration completed!');
}

main()
  .catch((e) => {
    console.error('Error migrating tasks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
