import { db } from '@/lib/db';

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminUser = await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    },
  });

  // Create regular users
  const user1 = await db.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'John Doe',
      role: 'user',
    },
  });

  const user2 = await db.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      id: 'user-2',
      email: 'user2@example.com',
      name: 'Jane Smith',
      role: 'user',
    },
  });

  // Create sample columns
  const todoColumn = await db.column.upsert({
    where: { id: 'todo-1' },
    update: {},
    create: {
      id: 'todo-1',
      title: 'To Do',
      position: 0,
    },
  });

  const inProgressColumn = await db.column.upsert({
    where: { id: 'progress-1' },
    update: {},
    create: {
      id: 'progress-1',
      title: 'In Progress',
      position: 1,
    },
  });

  const doneColumn = await db.column.upsert({
    where: { id: 'done-1' },
    update: {},
    create: {
      id: 'done-1',
      title: 'Done',
      position: 2,
    },
  });

  // Create sample tasks with different statuses
  await db.task.upsert({
    where: { id: 'task-1' },
    update: {},
    create: {
      id: 'task-1',
      title: 'Research project requirements',
      description: 'Gather and document all project requirements from stakeholders',
      columnId: todoColumn.id,
      position: 0,
      status: 'todo',
      assigneeId: user1.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  await db.task.upsert({
    where: { id: 'task-2' },
    update: {},
    create: {
      id: 'task-2',
      title: 'Create project timeline',
      description: 'Develop a detailed project timeline with milestones and deadlines',
      columnId: todoColumn.id,
      position: 1,
      status: 'todo',
      assigneeId: user2.id,
    },
  });

  await db.task.upsert({
    where: { id: 'task-3' },
    update: {},
    create: {
      id: 'task-3',
      title: 'Set up development environment',
      description: 'Configure local development environment and required tools',
      columnId: todoColumn.id,
      position: 2,
      status: 'paused',
      assigneeId: user1.id,
    },
  });

  // In progress tasks
  await db.task.upsert({
    where: { id: 'task-4' },
    update: {},
    create: {
      id: 'task-4',
      title: 'Design system architecture',
      description: 'Create high-level architecture design for the system',
      columnId: inProgressColumn.id,
      position: 0,
      status: 'in-progress',
      assigneeId: adminUser.id,
    },
  });

  await db.task.upsert({
    where: { id: 'task-5' },
    update: {},
    create: {
      id: 'task-5',
      title: 'Implement user authentication',
      description: 'Build secure authentication system with role-based access',
      columnId: inProgressColumn.id,
      position: 1,
      status: 'in-progress',
      assigneeId: user2.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  // Done tasks
  await db.task.upsert({
    where: { id: 'task-6' },
    update: {},
    create: {
      id: 'task-6',
      title: 'Project kickoff meeting',
      description: 'Conduct initial project kickoff with all team members',
      columnId: doneColumn.id,
      position: 0,
      status: 'done',
      assigneeId: adminUser.id,
    },
  });

  await db.task.upsert({
    where: { id: 'task-7' },
    update: {},
    create: {
      id: 'task-7',
      title: 'Setup repository and CI/CD',
      description: 'Initialize code repository and configure continuous integration',
      columnId: doneColumn.id,
      position: 1,
      status: 'done',
      assigneeId: user1.id,
    },
  });

  // Cancelled and overdue tasks
  await db.task.upsert({
    where: { id: 'task-8' },
    update: {},
    create: {
      id: 'task-8',
      title: 'Old feature request',
      description: 'This feature was cancelled due to budget constraints',
      columnId: todoColumn.id,
      position: 3,
      status: 'cancelled',
    },
  });

  await db.task.upsert({
    where: { id: 'task-9' },
    update: {},
    create: {
      id: 'task-9',
      title: 'Urgent bug fix',
      description: 'Fix critical security vulnerability',
      columnId: inProgressColumn.id,
      position: 2,
      status: 'overdue',
      assigneeId: adminUser.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
