export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'executive';
  phone?: string;
  avatar?: string;
  department?: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Lead {
  _id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source: string;
  industry?: string;
  status: string;
  priority: string;
  assignedTo?: User | null;
  estimatedValue: number;
  lastContacted?: string;
  nextFollowUp?: string;
  notes: { text: string; addedBy: string; addedAt: string }[];
  tags: string[];
  convertedToCustomer?: string | null;
  convertedToOpportunity?: string | null;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  industry?: string;
  status: string;
  assignedTo?: User | null;
  totalPurchases: number;
  lastPurchase?: string;
  notes: { text: string; addedBy: string; addedAt: string }[];
  tags: string[];
  source: string;
  leadSource?: string | null;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  _id: string;
  title: string;
  customer?: Customer | null;
  lead?: Lead | null;
  assignedTo?: User | null;
  stage: string;
  expectedValue: number;
  probability: number;
  expectedClosingDate?: string;
  notes: { text: string; addedBy: string; addedAt: string }[];
  lostReason?: string;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  assignedTo?: User | null;
  priority: string;
  dueDate?: string;
  relatedTo?: string;
  relatedModel?: string;
  status: string;
  completedAt?: string;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  _id: string;
  title: string;
  type?: string;
  description?: string;
  assignedTo?: User;
  lead?: Lead | null;
  customer?: Customer | null;
  opportunity?: Opportunity | null;
  followUpDate: string;
  status: string;
  completedAt?: string;
  notes?: string;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  _id: string;
  type: string;
  subject: string;
  description: string;
  lead?: string;
  customer?: string;
  opportunity?: string;
  performedBy: User;
  createdAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  relatedTo?: any;
  relatedModel?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user: User;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  metadata: any;
  ipAddress: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface DashboardSummary {
  kpi: {
    totalLeads: number;
    totalCustomers: number;
    totalOpportunities: number;
    totalTasks: number;
    wonOpportunities: number;
    lostOpportunities: number;
    pipelineOpportunities: number;
    pipelineValue: number;
    revenue: number;
    conversionRate: number;
  };
  upcoming: {
    followUps: FollowUp[];
    overdueTasks: Task[];
    recentLeads: Lead[];
    recentDeals: Opportunity[];
  };
}

export interface ChartData {
  leadsBySource: { _id: string; count: number }[];
  customerGrowth: { _id: string; count: number }[];
  leadStatus: { _id: string; count: number }[];
}
