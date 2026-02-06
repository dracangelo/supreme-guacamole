'use client';

import { useEffect, useState, useCallback } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Plus, MoreHorizontal, LayoutGrid, Users, LogOut, UserPlus, Palette, Edit2, Trash2, PlusCircle,
  Kanban, Sparkles, ChevronDown, Settings, Search, Filter, Star, Archive, Calendar, CheckCircle2,
  CheckCircle, X, Info, AlertTriangle, Moon, Sun, LogIn, Building2, Plus as PlusIcon,
  List, Clock, KanbanSquare as ViewModeIcon, MessageCircle, Send, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ThemeToggle } from '@/components/theme-toggle';

interface Column {
  id: string;
  title: string;
  position: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  position: number;
  status: string;
  assigneeId?: string;
  dueDate?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

// Task status colors and labels
const TASK_STATUS = {
  'todo': { label: 'To Do', color: 'bg-slate-500', textColor: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'done': { label: 'Done', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  'cancelled': { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  'paused': { label: 'Paused', color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  'overdue': { label: 'Overdue', color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
} as const;

type TaskStatus = keyof typeof TASK_STATUS;

// Loading Skeleton Components
function ColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-6">
        <Icon className="h-12 w-12 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

interface SortableColumnProps {
  column: Column;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditColumn: (column: Column) => void;
  onAddTask: (columnId: string) => void;
}

// Sortable Column Component
function SortableColumn({ column, tasks, onEditTask, onDeleteTask, onDeleteColumn, onEditColumn, onAddTask }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column', column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const columnTasks = tasks.filter(t => t.columnId === column.id).sort((a, b) => a.position - b.position);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex-shrink-0 w-72 sm:w-80">
      <Card className="h-full bg-card/40 backdrop-blur-xl border-white/5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group/column">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute -left-2 -top-1 w-1 h-7 sm:h-8 bg-gradient-to-br from-primary/50 to-primary/60 rounded-full"></div>
                <h3 className="font-bold text-base sm:text-lg tracking-tight">{column.title}</h3>
              </div>
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-primary/10 rounded-full">
                <span className="text-xs font-semibold text-primary/90">{columnTasks.length}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/20 hover:shadow-md hover:scale-110 transition-all duration-300"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => onEditColumn(column)} className="group">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <span className="group-hover:text-blue-600 group-hover:font-semibold transition-colors">Edit Column</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="group">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Archive className="h-4 w-4 text-white" />
                    </div>
                    <span className="group-hover:text-red-600 group-hover:font-semibold transition-colors">Delete Column</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <SortableTask key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
              ))}
            </div>
          </SortableContext>
          <Button
            variant="ghost"
            className="w-full mt-4 justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 group"
            onClick={() => onAddTask(column.id)}
          >
            <PlusCircle className="h-4 w-4 mr-2 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-200" />
            <span className="group-hover:text-primary group-hover:font-medium transition-all">Add Task</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface SortableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

// Sortable Task Component
function SortableTask({ task, onEdit, onDelete }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusInfo = TASK_STATUS[task.status as TaskStatus] || TASK_STATUS.todo;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group/task">
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-2xl hover:scale-[1.03] hover:border-primary/40 bg-card/60 border-white/5 transition-all duration-500 shadow-sm backdrop-blur-md">
        <CardContent className="p-4">
          <div className={`flex items-start justify-between gap-3 transition-all duration-200 ${isDragging ? 'scale-105' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-base truncate">{task.title}</h4>
                <Badge className={`text-white ${statusInfo.color} text-xs px-2.5 py-1 rounded-full font-medium hover:brightness-110 hover:shadow-sm hover:scale-105 transition-all duration-200`}>
                  {statusInfo.label}
                </Badge>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-primary/20 hover:shadow-md hover:scale-110 transition-all duration-300 flex-shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(task)} className="group">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Edit2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="group-hover:text-emerald-600 group-hover:font-semibold transition-colors">Edit</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="group">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="group-hover:text-red-600 group-hover:font-semibold transition-colors">Delete</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrelloPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<any | null>(null);
  const [currentBoard, setCurrentBoard] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editColumnDialogOpen, setEditColumnDialogOpen] = useState(false);
  const [userManagementDialogOpen, setUserManagementDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('todo');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState('');
  const [editColumnTitle, setEditColumnTitle] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [activeItem, setActiveItem] = useState<{ type: 'column' | 'task'; data: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'board' | 'calendar' | 'timeline' | 'list'>('board');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [addBoardDialogOpen, setAddBoardDialogOpen] = useState(false);
  const [addOrgDialogOpen, setAddOrgDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Task Comments interface
  interface TaskComment {
    id: string;
    content: string;
    taskId: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    createdAt: string;
    updatedAt: string;
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getTasksForDate = (date: Date) => {
    if (!tasks.length) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [columnsRes, tasksRes] = await Promise.all([
        fetch('/api/trello/columns'),
        fetch('/api/trello/tasks'),
      ]);
      const columnsData = await columnsRes.json();
      const tasksData = await tasksRes.json();
      setColumns(columnsData.sort((a: Column, b: Column) => a.position - b.position));
      setTasks(tasksData.sort((a: Task, b: Task) => a.position - b.position));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/trello/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations');
      const data = await res.json();
      setOrganizations(data);
      if (data.length > 0 && !currentOrganization) {
        setCurrentOrganization(data[0]);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  }, [currentOrganization]);

  const loadBoards = useCallback(async (organizationId: string) => {
    if (!organizationId) return;
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      const orgBoards = data.filter((b: any) => b.organizationId === organizationId);
      setBoards(orgBoards);
      if (orgBoards.length > 0 && !currentBoard) {
        setCurrentBoard(orgBoards[0]);
        // Load columns and tasks for the selected board
        const [columnsRes, tasksRes] = await Promise.all([
          fetch(`/api/trello/columns?boardId=${orgBoards[0].id}`),
          fetch(`/api/trello/tasks?boardId=${orgBoards[0].id}`),
        ]);
        const columnsData = await columnsRes.json();
        const tasksData = await tasksRes.json();
        setColumns(columnsData.sort((a: Column, b: Column) => a.position - b.position));
        setTasks(tasksData.sort((a: Task, b: Task) => a.position - b.position));
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  }, [currentBoard]);

  const loadComments = useCallback(async (taskId: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/task-comments?taskId=${taskId}`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, []);

  const handleAddComment = async () => {
    if (!newComment.trim() || !editingTask || !currentUser) return;

    try {
      const res = await fetch('/api/task-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          taskId: editingTask.id,
          userId: currentUser.id,
        }),
      });

      if (res.ok) {
        setNewComment('');
        loadComments(editingTask.id);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!editingTask) return;

    try {
      const res = await fetch(`/api/task-comments/comment-actions?id=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadComments(editingTask.id);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  useEffect(() => {
    loadOrganizations();
    loadUsers();
    const savedUser = localStorage.getItem('trello_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, [loadUsers, loadOrganizations]);

  // Load boards when organization changes
  useEffect(() => {
    if (currentOrganization) {
      loadBoards(currentOrganization.id);
    }
  }, [currentOrganization, loadBoards]);

  // Load columns and tasks when board changes
  useEffect(() => {
    if (currentBoard) {
      const loadDataForBoard = async () => {
        try {
          const [columnsRes, tasksRes] = await Promise.all([
            fetch(`/api/trello/columns?boardId=${currentBoard.id}`),
            fetch(`/api/trello/tasks?boardId=${currentBoard.id}`),
          ]);
          const columnsData = await columnsRes.json();
          const tasksData = await tasksRes.json();
          setColumns(columnsData.sort((a: Column, b: Column) => a.position - b.position));
          setTasks(tasksData.sort((a: Task, b: Task) => a.position - b.position));
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      };
      loadDataForBoard();
    } else {
      // Clear data when no board is selected
      setColumns([]);
      setTasks([]);
    }
  }, [currentBoard]);

  const onEditTask = async (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description);
    setEditTaskStatus(task.status as TaskStatus);
    setEditTaskDueDate(task.dueDate || '');
    setEditTaskAssigneeId(task.assigneeId || '');
    setEditTaskDialogOpen(true);
    setComments([]);
    setNewComment('');
    await loadComments(task.id);
  };

  const onEditColumn = (column: Column) => {
    setEditingColumn(column);
    setEditColumnTitle(column.title);
    setEditColumnDialogOpen(true);
  };

  const onDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await fetch(`/api/trello/tasks/${taskId}`, { method: 'DELETE' });
      loadData();
    }
  };

  const onDeleteColumn = async (columnId: string) => {
    if (window.confirm('Are you sure you want to delete this column and all its tasks?')) {
      await fetch(`/api/trello/columns/${columnId}`, { method: 'DELETE' });
      loadData();
    }
  };

  const onAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setAddTaskDialogOpen(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Only trigger when no dialogs are open
      if (editTaskDialogOpen || editColumnDialogOpen || addTaskDialogOpen ||
        addColumnDialogOpen || addUserDialogOpen || addBoardDialogOpen ||
        addOrgDialogOpen || userManagementDialogOpen || loginDialogOpen) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          setAddColumnDialogOpen(true);
          break;
        case 'c':
          e.preventDefault();
          if (columns.length > 0) {
            onAddTask(columns[0].id);
          }
          break;
        case '?':
          e.preventDefault();
          alert('Keyboard Shortcuts:\nN - New Column\nC - New Card\n? - Show Help');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    editTaskDialogOpen, editColumnDialogOpen, addTaskDialogOpen,
    addColumnDialogOpen, addUserDialogOpen, addBoardDialogOpen,
    addOrgDialogOpen, userManagementDialogOpen, loginDialogOpen,
    columns, onAddTask
  ]);
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    if (active.data.current) {
      setActiveItem(active.data.current as { type: 'column' | 'task'; data: any });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    if (activeData.type === 'task' && overData) {
      if (overData.type === 'task') {
        const activeTask = tasks.find(t => t.id === active.id);
        const overTask = tasks.find(t => t.id === over.id);

        if (!activeTask || !overTask || activeTask.id === overTask.id) return;

        const newTasks = [...tasks];
        const activeIndex = newTasks.findIndex(t => t.id === activeTask.id);
        const overIndex = newTasks.findIndex(t => t.id === overTask.id);

        newTasks.splice(activeIndex, 1);
        newTasks.splice(overIndex, 0, activeTask);

        newTasks.forEach((task, index) => {
          task.position = index;
        });

        setTasks(newTasks);

        await fetch('/api/trello/tasks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: activeTask.id,
            overTaskId: overTask.id,
          }),
        });
      } else if (overData.type === 'column') {
        const activeTask = tasks.find(t => t.id === active.id);
        const columnTasks = tasks.filter(t => t.columnId === overData.column.id);

        if (!activeTask) return;

        const newTasks = tasks.map(t =>
          t.id === activeTask.id
            ? { ...t, columnId: overData.column.id, position: columnTasks.length }
            : t
        );

        setTasks(newTasks);

        await fetch('/api/trello/tasks/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: activeTask.id,
            columnId: overData.column.id,
            position: columnTasks.length,
          }),
        });
      }
    } else if (activeData.type === 'column' && overData?.type === 'column') {
      const activeColumn = columns.find(c => c.id === active.id);
      const overColumn = columns.find(c => c.id === over.id);

      if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

      const newColumns = [...columns];
      const activeIndex = newColumns.findIndex(c => c.id === activeColumn.id);
      const overIndex = newColumns.findIndex(c => c.id === overColumn.id);

      newColumns.splice(activeIndex, 1);
      newColumns.splice(overIndex, 0, activeColumn);

      newColumns.forEach((column, index) => {
        column.position = index;
      });

      setColumns(newColumns);

      await fetch('/api/trello/columns/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: activeColumn.id,
          overColumnId: overColumn.id,
        }),
      });
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !currentBoard) return;

    const newPosition = columns.length;
    await fetch('/api/trello/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newColumnTitle,
        position: newPosition,
        boardId: currentBoard.id,
      }),
    });

    setNewColumnTitle('');
    setAddColumnDialogOpen(false);
    // Reload data instead of using loadData() to preserve board context
    const [columnsRes, tasksRes] = await Promise.all([
      fetch(`/api/trello/columns?boardId=${currentBoard.id}`),
      fetch(`/api/trello/tasks?boardId=${currentBoard.id}`),
    ]);
    const columnsData = await columnsRes.json();
    const tasksData = await tasksRes.json();
    setColumns(columnsData.sort((a: Column, b: Column) => a.position - b.position));
    setTasks(tasksData.sort((a: Task, b: Task) => a.position - b.position));
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedColumnId || !currentBoard) return;

    const columnTasks = tasks.filter(t => t.columnId === selectedColumnId);
    await fetch('/api/trello/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTaskTitle,
        description: newTaskDescription,
        columnId: selectedColumnId,
        position: columnTasks.length,
        status: newTaskStatus,
        assigneeId: newTaskAssigneeId || null,
        dueDate: newTaskDueDate || null,
        boardId: currentBoard.id,
      }),
    });

    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskStatus('todo');
    setNewTaskDueDate('');
    setNewTaskAssigneeId('');
    setAddTaskDialogOpen(false);
    setSelectedColumnId(null);
    // Reload data for current board
    const [columnsRes, tasksRes] = await Promise.all([
      fetch(`/api/trello/columns?boardId=${currentBoard.id}`),
      fetch(`/api/trello/tasks?boardId=${currentBoard.id}`),
    ]);
    const columnsData = await columnsRes.json();
    const tasksData = await tasksRes.json();
    setColumns(columnsData.sort((a: Column, b: Column) => a.position - b.position));
    setTasks(tasksData.sort((a: Task, b: Task) => a.position - b.position));
  };

  const handleEditTask = async () => {
    if (!editingTask || !editTaskTitle.trim()) return;

    await fetch(`/api/trello/tasks/${editingTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTaskTitle,
        description: editTaskDescription,
        status: editTaskStatus,
        dueDate: editTaskDueDate || null,
        assigneeId: editTaskAssigneeId || null,
      }),
    });

    setEditTaskDialogOpen(false);
    setEditingTask(null);
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskStatus('todo');
    setEditTaskDueDate('');
    setEditTaskAssigneeId('');
    loadData();
  };

  const handleEditColumn = async () => {
    if (!editingColumn || !editColumnTitle.trim()) return;

    await fetch(`/api/trello/columns/${editingColumn.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editColumnTitle,
      }),
    });

    setEditColumnDialogOpen(false);
    setEditingColumn(null);
    setEditColumnTitle('');
    loadData();
  };

  const handleAddBoard = async () => {
    if (!newBoardName.trim() || !currentOrganization) return;

    await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newBoardName,
        description: newBoardDescription,
        organizationId: currentOrganization.id,
      }),
    });

    setNewBoardName('');
    setNewBoardDescription('');
    setAddBoardDialogOpen(false);
    loadBoards(currentOrganization.id);
  };

  const handleAddOrganization = async () => {
    if (!newOrgName.trim()) return;

    await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newOrgName,
        description: newOrgDescription,
        ownerId: currentUser?.id || 'default-user',
      }),
    });

    setNewOrgName('');
    setNewOrgDescription('');
    setAddOrgDialogOpen(false);
    loadOrganizations();
  };

  const handleLogin = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const res = await fetch('/api/trello/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUserEmail, name: newUserName }),
    });

    if (res.ok) {
      const user = await res.json();
      setCurrentUser(user);
      localStorage.setItem('trello_user', JSON.stringify(user));
      setLoginDialogOpen(false);
      setNewUserName('');
      setNewUserEmail('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('trello_user');
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    await fetch('/api/trello/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
      }),
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('user');
    setAddUserDialogOpen(false);
    loadUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await fetch(`/api/trello/users/${userId}`, { method: 'DELETE' });
      loadUsers();
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 animate-gradient-bg overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {isMounted && [...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-64 h-64 rounded-full bg-primary/10"
                style={{
                  animation: `sparkle 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  left: `${Math.random() * 80}%`,
                  top: `${Math.random() * 80}%`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-1 border border-primary/10 transition-all duration-500 hover:shadow-primary/5">
          <div className="bg-card/40 rounded-[1.4rem] p-8 border border-white/5">
            <CardContent className="p-8 space-y-6 text-center">
              <div className="flex justify-center mb-6">
                <Kanban className="h-20 w-20 text-primary" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent bg-clip-text">
                  Trello
                  <span className="text-white">Clone</span>
                </h1>
                <p className="text-muted-foreground">Sign in to continue</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-base font-semibold">Your Name</Label>
                  <Input
                    id="email"
                    placeholder="Enter your name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-base font-semibold">Your Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <Button
                  onClick={handleLogin}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 to-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <header className="border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <Kanban className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-spin-slow" />
                </div>
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Trello
                    <span className="text-foreground/90">Clone</span>
                  </span>
                </h1>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 animate-pulse" />
              </div>
              <div className="hidden sm:flex flex-col">
                <p className="text-sm text-muted-foreground font-medium">{currentUser?.name || 'Welcome'}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
              </div>
              {currentUser.role === 'admin' && (
                <Button
                  onClick={() => setUserManagementDialogOpen(true)}
                  className="hidden sm:flex hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Workspace Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:shadow-sm hover:scale-105 transition-all duration-300">
                  <Building2 className="h-4 w-4 mr-2" />
                  {currentOrganization?.name || 'Select Workspace'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {organizations.map((org: any) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => {
                      setCurrentOrganization(org);
                      setCurrentBoard(null);
                    }}
                    className="group"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="group-hover:text-primary group-hover:font-semibold transition-colors">{org.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setAddOrgDialogOpen(true)} className="group border-t">
                  <div className="flex items-center gap-2">
                    <PlusIcon className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
                    <span className="group-hover:text-green-600 group-hover:font-semibold transition-colors">New Workspace</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Board Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:shadow-sm hover:scale-105 transition-all duration-300">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  {currentBoard?.name || 'Select Board'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {boards.map((board: any) => (
                  <DropdownMenuItem
                    key={board.id}
                    onClick={() => setCurrentBoard(board)}
                    className="group"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                      <div className="flex-1">
                        <div className="text-sm group-hover:text-purple-600 group-hover:font-semibold transition-colors">{board.name}</div>
                        {board.description && (
                          <div className="text-xs text-muted-foreground">{board.description}</div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {boards.length < (currentOrganization?.boardLimit || 7) && (
                  <DropdownMenuItem onClick={() => setAddBoardDialogOpen(true)} className="group border-t">
                    <div className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                      <span className="group-hover:text-purple-600 group-hover:font-semibold transition-colors">New Board</span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hover:bg-accent/50 hover:shadow-sm hover:scale-105 transition-all duration-300" title="Keyboard shortcuts">
                  <span className="sr-only">Keyboard shortcuts</span>
                  <span className="text-xs font-mono">⌨️</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-3 space-y-2">
                  <h4 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">New Column</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">N</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">New Card</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">C</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Help</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">?</kbd>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hover:bg-accent/50 hover:shadow-sm hover:scale-105 transition-all duration-300">
                  {currentUser.name || currentUser.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="group">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                    <span className="group-hover:text-red-500 group-hover:font-semibold transition-colors">Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <h2 className="text-lg sm:text-xl font-bold">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  Board
                </div>
                {columns.length > 0 && (
                  <span className="text-sm text-muted-foreground">({columns.length} boards)</span>
                )}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 sm:h-10 w-48 sm:w-64 rounded-full bg-white/90 border-0 shadow-sm focus:ring-2 focus:ring-purple-500/30 focus:shadow-md transition-all"
                  />
                </div>
                <div className="hidden sm:flex gap-2">
                  {Object.entries(TASK_STATUS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => setFilterStatus(key === filterStatus ? 'all' : key as TaskStatus)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${filterStatus === 'all' || filterStatus === key
                        ? `${color} text-white shadow-lg hover:shadow-md`
                        : 'border-muted bg-white/50 hover:bg-white/80'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {Object.entries(TASK_STATUS).map(([key, { label, color }]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => setFilterStatus(key === filterStatus ? 'all' : key as TaskStatus)}
                        >
                          <div className={`w-3 h-3 rounded-full mr-2 ${color}`} />
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-4 px-2 py-3 bg-gradient-to-r from-primary/5 to-purple-600/10 rounded-2xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
                  <LayoutGrid className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold">{totalTasks}</h3>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="bg-white/90 rounded-xl p-4 shadow-md">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Progress</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-full">
          {viewMode === 'board' ? (
            <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {isLoading ? (
                <div className="flex gap-4 sm:gap-6 pb-4 overflow-x-auto">
                  {[1, 2, 3].map((i) => (
                    <ColumnSkeleton key={i} />
                  ))}
                </div>
              ) : columns.length === 0 ? (
                <div className="p-8 sm:p-12">
                  <EmptyState
                    icon={LayoutGrid}
                    title="No columns yet"
                    description="Create your first column to start organizing your tasks"
                    action={
                      <Button
                        onClick={() => setAddColumnDialogOpen(true)}
                        className="hover:shadow-lg hover:scale-105 transition-all duration-300"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Column
                      </Button>
                    }
                  />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-8 sm:p-12">
                  <EmptyState
                    icon={CheckCircle}
                    title="No tasks to display"
                    description="Try adjusting your filters or create some new tasks"
                  />
                </div>
              ) : (
                <div className="flex gap-4 sm:gap-6 pb-4 overflow-x-auto min-w-max">
                  <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                    {columns.map((column) => (
                      <SortableColumn
                        key={column.id}
                        column={column}
                        tasks={filteredTasks}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onDeleteColumn={onDeleteColumn}
                        onEditColumn={onEditColumn}
                        onAddTask={onAddTask}
                      />
                    ))}
                  </SortableContext>
                  <Card className="flex-shrink-0 w-72 sm:w-80 border-2 border-dashed border-white/10 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group">
                    <CardContent className="p-6 h-full flex items-center justify-center min-h-[180px] sm:min-h-[200px]">
                      <Button
                        variant="outline"
                        className="w-full hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                        onClick={() => setAddColumnDialogOpen(true)}
                      >
                        <PlusCircle className="h-5 w-5 mr-2 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-200" />
                        <span className="group-hover:font-semibold transition-all">Add Column</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DndContext>
          ) : viewMode === 'calendar' ? (
            <div className="p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                  className="hover:bg-primary/10 hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-bold">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                  className="hover:bg-primary/10 hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <div
                    key={index}
                    className={`
                        min-h-[120px] p-2 rounded-lg border-2 transition-all duration-200
                        ${date
                        ? 'bg-gradient-to-br from-white to-white/50 hover:border-primary/50 hover:shadow-lg cursor-pointer'
                        : 'bg-transparent border-transparent'
                      }
                      `}
                  >
                    {date && (
                      <>
                        <div className="text-sm font-semibold text-muted-foreground mb-2">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {getTasksForDate(date).map(task => {
                            const statusInfo = TASK_STATUS[task.status as TaskStatus] || TASK_STATUS.todo;
                            return (
                              <div
                                key={task.id}
                                onClick={() => onEditTask(task)}
                                className={`
                                    text-xs p-2 rounded-md cursor-pointer
                                    hover:shadow-md hover:scale-105 transition-all duration-200
                                    ${statusInfo.bgColor} ${statusInfo.textColor}
                                    border border-opacity-20 ${statusInfo.borderColor}
                                  `}
                              >
                                <div className="font-medium truncate">{task.title}</div>
                                {task.description && (
                                  <div className="text-[10px] opacity-70 truncate">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {viewMode === 'timeline' ? 'Timeline View' : 'List View'}
                </p>
                <p className="text-sm mt-2">Coming soon...</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </main>

      <DragOverlay>
        {activeId && activeItem?.type === 'task' && activeItem.data?.task && (
          <Card className="w-72 shadow-2xl rotate-3">
            <CardContent className="p-3">
              <h4 className="font-medium text-sm">{activeItem.data.task.title}</h4>
              {activeItem.data.task.description && (
                <p className="text-xs text-muted-foreground">{activeItem.data.task.description}</p>
              )}
            </CardContent>
          </Card>
        )}
        {activeId && activeItem?.type === 'column' && activeItem.data?.column && (
          <Card className="w-80 shadow-2xl">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg">{activeItem.data.column.title}</h3>
            </CardContent>
          </Card>
        )}
      </DragOverlay>

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600/40 flex items-center justify-center">
                <PlusCircle className="h-4 w-4 text-white" />
              </div>
              Add New Column
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                placeholder="Enter column title..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                className="h-11"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setAddColumnDialogOpen(false)}
              className="hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button onClick={handleAddColumn} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600/40 flex items-center justify-center">
                <PlusCircle className="h-4 w-4 text-white" />
              </div>
              Add New Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter task description..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={4}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newTaskStatus} onValueChange={(value) => setNewTaskStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS).map(([key, { label, color }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${color}`}></div>
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={newTaskAssigneeId} onValueChange={setNewTaskAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddTaskDialogOpen(false);
                setNewTaskTitle('');
                setNewTaskDescription('');
                setNewTaskStatus('todo');
                setNewTaskDueDate('');
                setNewTaskAssigneeId('');
              }}
              className="hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button onClick={handleAddTask} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input
                  placeholder="Enter task title..."
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter task description..."
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  rows={4}
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editTaskStatus} onValueChange={(value) => setEditTaskStatus(value as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_STATUS).map(([key, { label, color }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${color}`}></div>
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={editTaskAssigneeId} onValueChange={setEditTaskAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Comments</h3>
                <Badge variant="secondary" className="ml-auto">
                  {comments.length}
                </Badge>
              </div>

              {/* Comments List */}
              <ScrollArea className="h-48 w-full pr-4 mb-4">
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment: TaskComment) => (
                      <div key={comment.id} className="group bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-primary">
                                    {comment.user.name?.charAt(0).toUpperCase() || comment.user.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium">
                                  {comment.user.name || comment.user.email}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground break-words">{comment.content}</p>
                          </div>
                          {(comment.userId === currentUser?.id || currentUser?.role === 'admin') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setEditTaskDialogOpen(false);
                setEditingTask(null);
                setEditTaskTitle('');
                setEditTaskDescription('');
                setEditTaskStatus('todo');
                setEditTaskDueDate('');
                setEditTaskAssigneeId('');
                setComments([]);
                setNewComment('');
              }}
              className="hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button onClick={handleEditTask} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              <Edit2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={editColumnDialogOpen} onOpenChange={setEditColumnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600/40 flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              Edit Column
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                placeholder="Enter column title..."
                value={editColumnTitle}
                onChange={(e) => setEditColumnTitle(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setEditColumnDialogOpen(false);
                setEditingColumn(null);
                setEditColumnTitle('');
              }}
              className="hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button onClick={handleEditColumn} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              <Edit2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Management Dialog */}
      <Dialog open={userManagementDialogOpen} onOpenChange={setUserManagementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600/40 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              User Management
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              onClick={() => setAddUserDialogOpen(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 to-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-primary/30 bg-gradient-to-br from-white/50 to-white/80 transition-all duration-200">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/40 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="hover:bg-accent/50">
                        {user.role}
                      </Badge>
                    </div>
                    {user.id !== currentUser?.id && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        className="hover:bg-destructive/90 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 transition-transform hover:scale-110" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setUserManagementDialogOpen(false)} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Board Dialog */}
      <Dialog open={addBoardDialogOpen} onOpenChange={setAddBoardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600/40 flex items-center justify-center">
                <LayoutGrid className="h-4 w-4 text-white" />
              </div>
              Add New Board
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Board Name</Label>
              <Input
                placeholder="Enter board name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Enter board description"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                rows={3}
                className="h-11 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddBoardDialogOpen(false);
                setNewBoardName('');
                setNewBoardDescription('');
              }}
              className="hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button onClick={handleAddBoard} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Organization Dialog */}
      <Dialog open={addOrgDialogOpen} onOpenChange={setAddOrgDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600/40 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              Add New Workspace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input
                placeholder="Enter workspace name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Enter workspace description"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                rows={3}
                className="h-11 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddOrgDialogOpen(false);
                setNewOrgName('');
                setNewOrgDescription('');
              }}
              className="hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button onClick={handleAddOrganization} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              <Building2 className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600/40 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              Add New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Enter user name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Label htmlFor="email" className="sr-only">Email address</Label>
              <Input
                id="email"
                placeholder="Enter user email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as 'admin' | 'user')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                      <span>User</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/40"></div>
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddUserDialogOpen(false);
                setNewUserName('');
                setNewUserEmail('');
                setNewUserRole('user');
              }}
              className="hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

