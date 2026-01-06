/**
 * Simple in-memory agent store for MVP
 * In production, this would be replaced with a database
 */

import { Agent, AgentStatus } from './cursor-api/types';

interface StoredAgent extends Agent {
  repository?: string;
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

class AgentStore {
  private agents: Map<string, StoredAgent> = new Map();

  addAgent(agent: Agent, repository?: string, branch?: string): void {
    const now = new Date().toISOString();
    this.agents.set(agent.id, {
      ...agent,
      repository,
      branch,
      createdAt: now,
      updatedAt: now,
    });
  }

  getAgent(id: string): StoredAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): StoredAgent[] {
    return Array.from(this.agents.values());
  }

  updateAgentStatus(id: string, status: AgentStatus): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.updatedAt = new Date().toISOString();
    }
  }

  removeAgent(id: string): void {
    this.agents.delete(id);
  }
}

// Singleton instance
export const agentStore = new AgentStore();

