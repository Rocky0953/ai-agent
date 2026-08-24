import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  planProjectWithManager, 
  executeWorkerSubtask, 
  synthesizeProjectReview, 
  generateMeetingDiscussion,
  generateEmployeeProfile,
  validateApiKey 
} from './server/geminiService.ts';
import { keyPoolManager } from './server/geminiKeyPool.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health & Basic Status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasEnvApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: Date.now()
    });
  });

  // Step 0: Real-time Key Pool & Workload Telemetry Endpoint
  app.get('/api/office/key-pool-status', (req, res) => {
    try {
      const topWorker = req.query.topWorker as string | undefined;
      const telemetry = keyPoolManager.getTelemetry(topWorker);
      res.json(telemetry);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Telemetry error';
      res.status(500).json({ error: msg });
    }
  });

  // Step 1: Manager plans project
  app.post('/api/office/plan', async (req, res) => {
    try {
      const { ownerPrompt, workerList, customApiKey, topWorkerId } = req.body;
      if (!ownerPrompt) {
        return res.status(400).json({ error: 'Owner prompt is required' });
      }
      const plan = await planProjectWithManager({
        ownerPrompt,
        workerList: workerList || [],
        customApiKey,
        topWorkerId
      });
      res.json(plan);
    } catch (error: unknown) {
      console.error('Plan generation failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  });

  // Step 2: Individual worker executes task (PRO Key routed to hardest worker)
  app.post('/api/office/worker-execute', async (req, res) => {
    try {
      const { worker, task, projectContext, isTopPerformer, customApiKey } = req.body;
      if (!worker || !task || !projectContext) {
        return res.status(400).json({ error: 'Missing worker, task, or projectContext parameter' });
      }
      const result = await executeWorkerSubtask({
        worker,
        task,
        projectContext,
        isTopPerformer: Boolean(isTopPerformer),
        customApiKey
      });
      res.json(result);
    } catch (error: unknown) {
      console.error('Worker execution failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  });

  // Step 3: Synthesis & QA Review
  app.post('/api/office/review-synthesize', async (req, res) => {
    try {
      const { projectTitle, ownerPrompt, allDeliverables, customApiKey, topWorkerId } = req.body;
      const review = await synthesizeProjectReview({
        projectTitle,
        ownerPrompt,
        allDeliverables: allDeliverables || [],
        customApiKey,
        topWorkerId
      });
      res.json(review);
    } catch (error: unknown) {
      console.error('Review synthesis failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  });

  // Step 4: Conference Room Meeting
  app.post('/api/office/meeting', async (req, res) => {
    try {
      const { topic, workers, customApiKey } = req.body;
      const discussion = await generateMeetingDiscussion({
        topic: topic || 'Sprint retrospective and product brainstorming',
        workers: workers || [],
        customApiKey
      });
      res.json(discussion);
    } catch (error: unknown) {
      console.error('Meeting discussion failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  });

  // Step 5: AI Employee Profile Generator
  app.post('/api/office/generate-employee', async (req, res) => {
    try {
      const { roleHint, departmentHint } = req.body;
      const profile = await generateEmployeeProfile({
        roleHint,
        departmentHint
      });
      res.json(profile);
    } catch (error: unknown) {
      console.error('Generate employee failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: msg });
    }
  });

  // Step 6: Test custom API Key
  app.post('/api/office/validate-key', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }
      const result = await validateApiKey(apiKey);
      res.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Validation error';
      res.status(500).json({ error: msg });
    }
  });

  // Vite Middleware / Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pixel AI Office server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
