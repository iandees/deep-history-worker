# Deep History Viewer - Cloudflare Worker

TypeScript port of the [Mapki OSM Deep History viewer](https://github.com/iandees/deep-history-py), running as a Cloudflare Worker using the Hono framework.

## Features

- View complete history of OpenStreetMap elements (nodes, ways, relations)
- Visual diff showing changes between versions
- Backwards compatible with the original Mapki URLs (`/history/node.php?id=XXX`, etc.)

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI (installed as dev dependency)

### Setup

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The development server will start at http://localhost:8787

### Routes

- `/history` - Main entry point with search form
- `/history/node/:id` - View history for a specific node
- `/history/way/:id` - View history for a specific way
- `/history/relation/:id` - View history for a specific relation
- `/history/node.php?id=XXX` - Legacy redirect (backwards compatible)
- `/history/way.php?id=XXX` - Legacy redirect (backwards compatible)
- `/history/relation.php?id=XXX` - Legacy redirect (backwards compatible)

## Deployment

### Configure Custom Domain

1. Add `osm.mapki.com` as a custom domain in Cloudflare
2. Update `wrangler.toml` with the route configuration:

```toml
routes = [
  { pattern = "osm.mapki.com/history/*", zone_name = "mapki.com" }
]
```

### Deploy

```bash
npm run deploy
```

## License

Apache 2.0 (same as original)
