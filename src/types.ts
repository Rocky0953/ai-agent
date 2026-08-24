export interface WorkerCharacter {
  id: string;
  name: string;
  role: string;
  department: 'Leadership' | 'Engineering' | 'Design' | 'QA & Ops' | 'Security';
  personality: string;
  avatarSprite: string;
  spriteColor: string;
  specialty: string[];
  tasksCompleted: number;
  status: 'idle' | 'working' | 'collaborating' | 'break' | 'reviewing';
  assignedTask?: string;
  thoughtBubble?: string;
  energy: number;
  coffeeLevel: number;
  deskPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  badge?: string;
  isTopPerformer?: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  assignedWorkerRole: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  deliverableType: 'code' | 'doc' | 'architecture' | 'review' | 'test';
  deliverableContent?: string;
  suggestedFilename?: string;
  workNotes?: string;
  priority: 'urgent' | 'high' | 'medium';
  linesOfCode?: number;
  executedWithProKey?: boolean;
  keyLabelUsed?: string;
}

export interface ProjectPlan {
  id: string;
  projectTitle: string;
  ownerPrompt: string;
  managerSummary: string;
  announcementMessage: string;
  timestamp: number;
  status: 'planning' | 'in_progress' | 'synthesis' | 'completed' | 'failed';
  tasks: SubTask[];
  finalReview?: {
    overallScore: number;
    executiveSummary: string;
    qaNotes: string[];
    releaseReady: boolean;
  };
}

export interface OfficeTelemetry {
  totalKeys: number;
  activeKeys: number;
  activeConcurrency: number;
  requestsPerMinute: number;
  workloadLevel: 'normal' | 'elevated' | 'heavy';
  workloadMessage: string;
  isHighWorkload: boolean;
  proKeyConfigured: boolean;
  proKeyAssignedWorker: string;
  keys: {
    id: string;
    maskedKey: string;
    isPro: boolean;
    label: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    status: 'active' | 'rate_limited' | 'cooling_down';
    lastUsedTimestamp: number;
    assignedWorker: string;
  }[];
}
