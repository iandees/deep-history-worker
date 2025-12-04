import { Hono } from 'hono';
import { historyRoutes } from './routes/history';

const app = new Hono();

// Mount history routes at /history for backwards compatibility
app.route('/history', historyRoutes);

// Redirect root to /history
app.get('/', (c) => c.redirect('/history'));

export default app;
