import { GoogleGenAI } from '@google/genai';

export interface ApiKeyNode {
  id: string;
  key: string;
  maskedKey: string;
  isPro: boolean;
  label: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastUsedTimestamp: number;
  status: 'active' | 'rate_limited' | 'cooling_down';
  coolingUntil?: number;
  currentAssignedWorker?: string;
}

function maskKey(key: string): string {
  if (key.length <= 12) return '***';
  return `${key.slice(0, 8)}...${key.slice(-6)}`;
}

class KeyPoolManager {
  private keyNodes: ApiKeyNode[] = [];
  private roundRobinIndex = 0;
  private recentRequestsTimestamps: number[] = [];
  private activeConcurrency = 0;

  constructor() {
    this.initializePool();
  }

  private initializePool() {
    const rawKeys = process.env.GEMINI_API_KEYS 
      ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
      : (process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY.trim()] : []);

    const proKey = process.env.GEMINI_PRO_API_KEY?.trim();

    this.keyNodes = rawKeys.map((keyStr, idx) => ({
      id: `key-node-${idx + 1}`,
      key: keyStr,
      maskedKey: maskKey(keyStr),
      isPro: false,
      label: `Node ${idx + 1} (Standard)`,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastUsedTimestamp: 0,
      status: 'active'
    }));

    if (proKey) {
      this.keyNodes.push({
        id: `key-node-pro`,
        key: proKey,
        maskedKey: maskKey(proKey),
        isPro: true,
        label: 'Node PRO TITAN (VIP Route)',
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        lastUsedTimestamp: 0,
        status: 'active'
      });
    }

    // Fallback if no keys defined
    if (this.keyNodes.length === 0) {
      this.keyNodes.push({
        id: 'key-node-default',
        key: process.env.GEMINI_API_KEY || '',
        maskedKey: '***',
        isPro: false,
        label: 'Default Cluster Node',
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        lastUsedTimestamp: 0,
        status: 'active'
      });
    }
  }

  public getProKeyNode(): ApiKeyNode | undefined {
    return this.keyNodes.find(n => n.isPro);
  }

  public acquireKeyForWorker(params?: {
    workerId?: string;
    workerName?: string;
    isTopPerformer?: boolean;
    isHeavyTask?: boolean;
    customApiKey?: string;
  }): { apiKey: string; keyNode: ApiKeyNode; isProAllocated: boolean } {
    const now = Date.now();
    this.activeConcurrency++;
    this.recentRequestsTimestamps.push(now);
    this.recentRequestsTimestamps = this.recentRequestsTimestamps.filter(t => now - t <= 60000);

    if (params?.customApiKey && params.customApiKey.trim().length > 10) {
      const customKey = params.customApiKey.trim();
      const existing = this.keyNodes.find(n => n.key === customKey);
      if (existing) {
        existing.totalCalls++;
        existing.lastUsedTimestamp = now;
        if (params.workerName) existing.currentAssignedWorker = params.workerName;
        return { apiKey: existing.key, keyNode: existing, isProAllocated: existing.isPro };
      }
      const tempNode: ApiKeyNode = {
        id: 'key-custom-adhoc',
        key: customKey,
        maskedKey: maskKey(customKey),
        isPro: false,
        label: `Worker Custom Key`,
        totalCalls: 1,
        successfulCalls: 0,
        failedCalls: 0,
        lastUsedTimestamp: now,
        status: 'active',
        currentAssignedWorker: params?.workerName
      };
      return { apiKey: customKey, keyNode: tempNode, isProAllocated: false };
    }

    if (params?.isTopPerformer || params?.isHeavyTask) {
      const proNode = this.getProKeyNode();
      if (proNode && proNode.status === 'active') {
        proNode.totalCalls++;
        proNode.lastUsedTimestamp = now;
        if (params.workerName) proNode.currentAssignedWorker = params.workerName;
        return { apiKey: proNode.key, keyNode: proNode, isProAllocated: true };
      }
    }

    const standardNodes = this.keyNodes.filter(n => !n.isPro && n.status === 'active');
    const availablePool = standardNodes.length > 0 ? standardNodes : this.keyNodes;

    const activeList = availablePool.filter(n => n.status === 'active');
    const chosenNode = activeList.length > 0
      ? activeList[this.roundRobinIndex % activeList.length]
      : availablePool[0];

    this.roundRobinIndex++;
    chosenNode.totalCalls++;
    chosenNode.lastUsedTimestamp = now;
    if (params?.workerName) chosenNode.currentAssignedWorker = params.workerName;

    return {
      apiKey: chosenNode.key,
      keyNode: chosenNode,
      isProAllocated: chosenNode.isPro
    };
  }

  public recordCallOutcome(key: string, success: boolean, errorMessage?: string) {
    this.activeConcurrency = Math.max(0, this.activeConcurrency - 1);
    const node = this.keyNodes.find(n => n.key === key);
    if (!node) return;

    if (success) {
      node.successfulCalls++;
      node.status = 'active';
    } else {
      node.failedCalls++;
      const err = (errorMessage || '').toLowerCase();
      if (err.includes('429') || err.includes('quota') || err.includes('resource_exhausted')) {
        node.status = 'cooling_down';
        node.coolingUntil = Date.now() + 30000;
      }
    }
  }

  public getTelemetry(topWorkerName?: string) {
    const now = Date.now();
    this.recentRequestsTimestamps = this.recentRequestsTimestamps.filter(t => now - t <= 60000);
    const rpm = this.recentRequestsTimestamps.length;

    let workloadLevel: 'normal' | 'elevated' | 'heavy' = 'normal';
    let workloadMessage = 'Normal throughput across API cluster.';

    if (this.activeConcurrency >= 4 || rpm >= 12) {
      workloadLevel = 'heavy';
      workloadMessage = `⚡ HEAVY WORKLOAD: ${this.activeConcurrency} concurrent tasks / ${rpm} req/min. Dynamic cluster load-balancing active.`;
    } else if (this.activeConcurrency >= 2 || rpm >= 6) {
      workloadLevel = 'elevated';
      workloadMessage = `Elevated activity: ${this.activeConcurrency} active tasks. Load distributed across cluster nodes.`;
    }

    const proNode = this.getProKeyNode();

    return {
      totalKeys: this.keyNodes.length,
      activeKeys: this.keyNodes.filter(n => n.status === 'active').length,
      activeConcurrency: this.activeConcurrency,
      requestsPerMinute: rpm,
      workloadLevel,
      workloadMessage,
      isHighWorkload: workloadLevel === 'heavy',
      proKeyConfigured: Boolean(proNode),
      proKeyAssignedWorker: topWorkerName || proNode?.currentAssignedWorker || 'Hardest Working Employee',
      keys: this.keyNodes.map(n => ({
        id: n.id,
        maskedKey: n.maskedKey,
        isPro: n.isPro,
        label: n.label,
        totalCalls: n.totalCalls,
        successfulCalls: n.successfulCalls,
        failedCalls: n.failedCalls,
        status: n.status,
        lastUsedTimestamp: n.lastUsedTimestamp,
        assignedWorker: n.currentAssignedWorker || (n.isPro ? (topWorkerName || 'Top Worker') : 'Shared Pool')
      }))
    };
  }

  public getClientForWorker(params?: {
    workerId?: string;
    workerName?: string;
    isTopPerformer?: boolean;
    isHeavyTask?: boolean;
    customApiKey?: string;
  }): { ai: GoogleGenAI; keyNode: ApiKeyNode; isProAllocated: boolean } {
    const { apiKey, keyNode, isProAllocated } = this.acquireKeyForWorker(params);
    const ai = new GoogleGenAI({
      apiKey: apiKey || process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    return { ai, keyNode, isProAllocated };
  }
}

export const keyPoolManager = new KeyPoolManager();
