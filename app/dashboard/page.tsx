'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { AgentDashboard } from '@/components/dashboard';
import { 
  Activity, 
  FolderKanban, 
  FileText, 
  Bot,
  ArrowRight,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  activeAgents: number;
  projects: number;
  featuresInProgress: number;
  totalFeatures: number;
}

interface RecentActivity {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  projectName: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumbs items={[{ label: 'Dashboard' }]} className="mb-6" />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Overview of your agents, projects, and features
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/">
                Launch Agent
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Agents
                  </CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeAgents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Projects
                  </CardTitle>
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.projects || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Features in Progress
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.featuresInProgress || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of {stats?.totalFeatures || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Features
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalFeatures || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All features
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest feature updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/features/${activity.id}`}
                                className="text-sm font-medium text-foreground hover:underline"
                              >
                                {activity.title}
                              </Link>
                              <Badge variant="outline" className="text-xs">
                                {activity.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {activity.projectName}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {recentActivity.length > 0 && (
                    <Button variant="ghost" className="w-full mt-4" asChild>
                      <Link href="/features">
                        View all features
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/">
                        <Bot className="mr-2 h-4 w-4" />
                        Launch New Agent
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/projects">
                        <FolderKanban className="mr-2 h-4 w-4" />
                        View Projects
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/features">
                        <FileText className="mr-2 h-4 w-4" />
                        View Features
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agents Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>
                  Monitor and manage all your Cursor Cloud Agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentDashboard
                  autoRefresh={true}
                  refreshInterval={5000}
                  onAgentSelect={setSelectedAgent}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
