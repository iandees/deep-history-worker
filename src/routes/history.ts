import { Hono } from 'hono';
import {
  fetchNodeHistory,
  fetchWayHistory,
  fetchRelationHistory,
  computeAllTagKeys,
  changeRow,
  ElementDoesntExistException
} from '../api';
import {
  renderIndex,
  renderNode,
  renderWay,
  renderRelation,
  renderMissingElement
} from '../templates';
import type { OSMElement, OSMMember, PropLine, TagLine, NodeLine, MemberLine } from '../types';

export const historyRoutes = new Hono();

// Error handler for missing elements
historyRoutes.onError((err, c) => {
  if (err instanceof ElementDoesntExistException) {
    return c.html(renderMissingElement(err.url, err.status));
  }
  throw err;
});

// Index page
historyRoutes.get('/', (c) => {
  return c.html(renderIndex());
});

// Legacy .php routes for backwards compatibility
historyRoutes.get('/node.php', (c) => {
  const id = c.req.query('id');
  if (id) {
    return c.redirect(`/history/node/${id}`);
  }
  return c.redirect('/history');
});

historyRoutes.get('/way.php', (c) => {
  const id = c.req.query('id');
  if (id) {
    return c.redirect(`/history/way/${id}`);
  }
  return c.redirect('/history');
});

historyRoutes.get('/relation.php', (c) => {
  const id = c.req.query('id');
  if (id) {
    return c.redirect(`/history/relation/${id}`);
  }
  return c.redirect('/history');
});

// Node history
historyRoutes.get('/node/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const versions = await fetchNodeHistory(id);

  const propLines: PropLine[] = [
    ['User', changeRow(versions, (v) => v.user, 'https://osm.org/user/{val}')],
    ['Visible', changeRow(versions, (v) => v.visible ?? true)],
    ['Changeset', changeRow(versions, (v) => v.changeset, 'https://osm.org/changeset/{val}')],
    ['Lat', changeRow(versions, (v) => v.lat)],
    ['Lon', changeRow(versions, (v) => v.lon)],
  ];

  const tagLines: TagLine[] = computeAllTagKeys(versions).map(t => [
    t,
    changeRow(versions, (v) => v.tags?.[t])
  ]);

  return c.html(renderNode(versions, propLines, tagLines));
});

// Way history
historyRoutes.get('/way/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const versions = await fetchWayHistory(id);

  const propLines: PropLine[] = [
    ['User', changeRow(versions, (v) => v.user, 'https://osm.org/user/{val}')],
    ['Visible', changeRow(versions, (v) => v.visible ?? true)],
    ['Changeset', changeRow(versions, (v) => v.changeset, 'https://osm.org/changeset/{val}')],
  ];

  const tagLines: TagLine[] = computeAllTagKeys(versions).map(t => [
    t,
    changeRow(versions, (v) => v.tags?.[t])
  ]);

  // Collect all nodes across all versions
  const allNodes: number[] = [];
  for (const v of versions) {
    for (const n of v.nodes || []) {
      if (!allNodes.includes(n)) {
        allNodes.push(n);
      }
    }
  }

  const nodeLines: NodeLine[] = allNodes.map(n => {
    const row = changeRow(versions, (v) => {
      const nds = v.nodes || [];
      const idx = nds.indexOf(n);
      return idx >= 0 ? idx : null;
    });
    return [n, row];
  });

  return c.html(renderWay(versions, propLines, tagLines, nodeLines));
});

// Relation history
historyRoutes.get('/relation/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const versions = await fetchRelationHistory(id);

  const propLines: PropLine[] = [
    ['User', changeRow(versions, (v) => v.user, 'https://osm.org/user/{val}')],
    ['Visible', changeRow(versions, (v) => v.visible ?? true)],
    ['Changeset', changeRow(versions, (v) => v.changeset, 'https://osm.org/changeset/{val}')],
  ];

  const tagLines: TagLine[] = computeAllTagKeys(versions).map(t => [
    t,
    changeRow(versions, (v) => v.tags?.[t])
  ]);

  // Collect all members across all versions
  const allMembers: OSMMember[] = [];
  for (const v of versions) {
    for (const m of v.members || []) {
      const exists = allMembers.some(
        existing => existing.type === m.type && existing.ref === m.ref && existing.role === m.role
      );
      if (!exists) {
        allMembers.push(m);
      }
    }
  }

  const memberLines: MemberLine[] = allMembers.map(m => {
    const row = changeRow(versions, (v) => {
      const members = v.members || [];
      return members.some(
        existing => existing.type === m.type && existing.ref === m.ref && existing.role === m.role
      );
    });
    return [m, row];
  });

  return c.html(renderRelation(versions, propLines, tagLines, memberLines));
});
