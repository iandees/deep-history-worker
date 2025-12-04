import type { OSMElement, PropLine, TagLine, NodeLine, MemberLine, CellInfo } from './types';

const MAX_COLUMN_LENGTH = 20;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(val: unknown): string {
  if (typeof val !== 'string') {
    return String(val ?? '');
  }

  if (val.length > MAX_COLUMN_LENGTH) {
    return `${escapeHtml(val.slice(0, MAX_COLUMN_LENGTH))}<abbr title="${escapeHtml(val)}">…</abbr>`;
  }

  return escapeHtml(val);
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <title>OSM Deep History</title>
    <link rel="stylesheet" href="/history/styles.css">
    <script src="/history/app.js"></script>
</head>
<body>
    ${content}
</body>
</html>`;
}

// Icon paths
const nodeIcon = `<img class="primitive-icon" src="/history/icons/node.svg" alt="node">`;
const wayIcon = `<img class="primitive-icon" src="/history/icons/way.svg" alt="way">`;
const relationIcon = `<img class="primitive-icon" src="/history/icons/relation.svg" alt="relation">`;
const tagIcon = `<img class="primitive-icon" src="/history/icons/tag.svg" alt="tag">`;
const memberIcon = `<img class="primitive-icon" src="/history/icons/member.svg" alt="member">`;

function getTypeIcon(type: string): string {
  switch (type) {
    case 'node': return nodeIcon;
    case 'way': return wayIcon;
    case 'relation': return relationIcon;
    default: return '';
  }
}

function renderCell(col: CellInfo): string {
  const valStr = truncate(col.val);
  if (col.url) {
    return `<td class="${col.clz}"><a href="${escapeHtml(col.url)}">${valStr}</a></td>`;
  }
  return `<td class="${col.clz}">${valStr}</td>`;
}

function renderTableHeader(versions: OSMElement[]): string {
  const lastVersion = versions[versions.length - 1].version;
  return `
    <thead>
        <tr>
            <th><a href="#version-${lastVersion}">Go to Recent &rightarrow;</a></th>
            ${versions.map(v => `<th id="version-${v.version}"><a href="#version-${v.version}">${v.version}</a></th>`).join('')}
        </tr>
        <tr>
            <th>&nbsp;</th>
            ${versions.map(v => `<th>${escapeHtml(v.timestamp)}</th>`).join('')}
        </tr>
    </thead>`;
}

function renderPropLines(versions: OSMElement[], propLines: PropLine[]): string {
  return propLines.map(([name, lineInfo]) => `
        <tr>
            <th>${escapeHtml(name)}</th>
            ${lineInfo.map(renderCell).join('')}
        </tr>`).join('');
}

function renderTagLines(versions: OSMElement[], tagLines: TagLine[]): string {
  if (tagLines.length === 0) {
    return `
        <tr>
            <td colspan="${versions.length + 1}">
                ${tagIcon}
                <em>No tags</em>
            </td>
        </tr>`;
  }

  return tagLines.map(([name, lineInfo]) => `
        <tr>
            <th>
                ${tagIcon}
                <code><a href="https://taginfo.openstreetmap.org/keys/${encodeURIComponent(name)}#overview">${escapeHtml(name)}</a></code>
            </th>
            ${lineInfo.map(col => `<td class="${col.clz}">${truncate(col.val)}</td>`).join('')}
        </tr>`).join('');
}

export function renderIndex(): string {
  return baseTemplate(`
<h3>Deep History</h3>
<hr/>

<table>
    <tr>
        <form action="node.php">
            <td align="right">
                <label for="node">Node ID:</label>
            </td>
            <td>
                <input type="text" size="16" id="node" name="id">
            </td>
            <td>
                <input type="submit" value="Get History">
            </td>
        </form>
    </tr>

    <tr>
        <form action="way.php">
            <td align="right">
                <label for="way">Way ID:</label>
            </td>
            <td>
                <input type="text" size="16" id="way" name="id">
            </td>
            <td>
                <input type="submit" value="Get History">
            </td>
        </form>
    </tr>
    <tr>
        <form action="relation.php">
            <td align="right">
                <label for="relation">Relation ID:</label>
            </td>
            <td>
                <input type="text" size="16" id="relation" name="id">
            </td>
            <td>
                <input type="submit" value="Get History">
            </td>
        </form>
    </tr>
</table>
`);
}

export function renderNode(
  versions: OSMElement[],
  propLines: PropLine[],
  tagLines: TagLine[]
): string {
  const id = versions[0].id;

  return baseTemplate(`
<h3>History of Node ${nodeIcon}&nbsp;<a href="https://openstreetmap.org/node/${id}">${id}</a></h3>
<hr/>

<table>
    ${renderTableHeader(versions)}
    <tbody>
        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Primitive Info</strong>
            </td>
        </tr>
        ${renderPropLines(versions, propLines)}

        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Tags</strong>
            </td>
        </tr>
        ${renderTagLines(versions, tagLines)}
    </tbody>
</table>
`);
}

export function renderWay(
  versions: OSMElement[],
  propLines: PropLine[],
  tagLines: TagLine[],
  nodeLines: NodeLine[]
): string {
  const id = versions[0].id;

  let nodesContent = '';
  if (nodeLines.length === 0) {
    nodesContent = `
        <tr>
            <td colspan="${versions.length + 1}">
                ${memberIcon}
                <em>No nodes</em>
            </td>
        </tr>`;
  } else {
    nodesContent = nodeLines.map(([nodeName, lineInfo]) => `
        <tr>
            <th>
                ${memberIcon}
                <code>${nodeName}</code>
            </th>
            ${lineInfo.map(col => `<td class="${col.clz}">&nbsp;</td>`).join('')}
        </tr>`).join('');
  }

  return baseTemplate(`
<h3>History of Way ${wayIcon}&nbsp;<a href="https://openstreetmap.org/way/${id}">${id}</a></h3>
<hr/>

<table>
    ${renderTableHeader(versions)}
    <tbody>
        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Primitive Info</strong>
            </td>
        </tr>
        ${renderPropLines(versions, propLines)}

        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Tags</strong>
            </td>
        </tr>
        ${renderTagLines(versions, tagLines)}

        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Nodes</strong>
            </td>
        </tr>
        ${nodesContent}
    </tbody>
</table>
`);
}

export function renderRelation(
  versions: OSMElement[],
  propLines: PropLine[],
  tagLines: TagLine[],
  memberLines: MemberLine[]
): string {
  const id = versions[0].id;

  let membersContent = '';
  if (memberLines.length === 0) {
    membersContent = `
        <tr>
            <td colspan="${versions.length + 1}">
                ${memberIcon}
                <em>No members</em>
            </td>
        </tr>`;
  } else {
    membersContent = memberLines.map(([member, lineInfo]) => `
        <tr>
            <th>
                ${getTypeIcon(member.type)}
                <code>${member.ref} - ${escapeHtml(member.role || '(no role)')}</code>
            </th>
            ${lineInfo.map(col => `<td class="${col.clz}">&nbsp;</td>`).join('')}
        </tr>`).join('');
  }

  return baseTemplate(`
<h3>History of Relation ${relationIcon}&nbsp;<a href="https://openstreetmap.org/relation/${id}">${id}</a></h3>
<hr/>

<table>
    ${renderTableHeader(versions)}
    <tbody>
        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Primitive Info</strong>
            </td>
        </tr>
        ${renderPropLines(versions, propLines)}

        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Tags</strong>
            </td>
        </tr>
        ${renderTagLines(versions, tagLines)}

        <tr>
            <td class="header" colspan="${versions.length + 1}">
                <strong>Members</strong>
            </td>
        </tr>
        ${membersContent}
    </tbody>
</table>
`);
}

export function renderMissingElement(url: string, status: number): string {
  return baseTemplate(`
<h3>Object Missing</h3>
<hr/>

<p>The OSM API server says that object doesn't exist. Perhaps you could <a href="/history">go look for another object</a>?</p>

<p><code>HTTP ${status} - <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></code></p>
`);
}
