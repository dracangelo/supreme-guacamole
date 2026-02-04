import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create a default organization
  const org = await prisma.organization.upsert({
    where: { slug: 'default-workspace' },
    update: {},
    create: {
      name: 'Default Workspace',
      slug: 'default-workspace',
      description: 'Your main workspace',
      ownerId: 'default-user',
      boardLimit: 7,
    },
  });

  console.log('Organization created:', org.name);

  // Create a default board in the organization
  const board = await prisma.board.upsert({
    where: { slug: 'main-board' },
    update: {},
    create: {
      name: 'Main Board',
      slug: 'main-board',
      description: 'Your first board',
      organizationId: org.id,
    },
  });

  console.log('Board created:', board.name);

  // Create default columns for the board
  const columns = await Promise.all([
    prisma.column.upsert({
      where: { id: 'col-todo' },
      update: { boardId: board.id },
      create: {
        id: 'col-todo',
        title: 'To Do',
        position: 0,
        boardId: board.id,
      },
    }),
    prisma.column.upsert({
      where: { id: 'col-inprogress' },
      update: { boardId: board.id },
      create: {
        id: 'col-inprogress',
        title: 'In Progress',
        position: 1,
        boardId: board.id,
      },
    }),
    prisma.column.upsert({
      where: { id: 'col-done' },
      update: { boardId: board.id },
      create: {
        id: 'col-done',
        title: 'Done',
        position: 2,
        boardId: board.id,
      },
    }),
  ]);

  console.log('Columns created:', columns.length);

  // Add some sample tasks
  const task1 = await prisma.task.upsert({
    where: { id: 'task-1' },
      update: {},
      create: {
        id: 'task-1',
        title: 'Welcome to your new board!',
        description: 'This is your first task. Drag and drop tasks to organize your work.',
        columnId: 'col-todo',
        position: 0,
        status: 'todo',
        boardId: board.id,
      },
    });

  const task2 = await prisma.task.upsert({
    where: { id: 'task-2' },
      update: {},
      create: {
        id: 'task-2',
        title: 'Try adding new columns',
        description: 'Click the "Add Column" button to create new lists.',
        columnId: 'col-todo',
        position: 1,
        status: 'todo',
        boardId: board.id,
      },
    });

  const task3 = await prisma.task.upsert({
    where: { id: 'task-3' },
      update: {},
      create: {
        id: 'task-3',
        title: 'Sample task in progress',
        description: 'This task shows how tasks look when they are in progress.',
        columnId: 'col-inprogress',
        position: 0,
        status: 'in-progress',
        boardId: board.id,
      },
    });

  const task4 = await prisma.task.upsert({
    where: { id: 'task-4' },
      update: {},
      create: {
        id: 'task-4',
        title: 'Completed task',
        description: 'Tasks move here when completed.',
        columnId: 'col-done',
        position: 0,
        status: 'done',
        boardId: board.id,
      },
    });

  console.log('Sample tasks created');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
