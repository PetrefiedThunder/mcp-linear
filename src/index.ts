#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://api.linear.app/graphql";
const RATE_LIMIT_MS = 200;
let last = 0;

function getKey(): string {
  const k = process.env.LINEAR_API_KEY;
  if (!k) throw new Error("LINEAR_API_KEY required");
  return k;
}

async function gql(query: string, variables?: any): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const res = await fetch(BASE, {
    method: "POST", headers: { Authorization: getKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Linear ${res.status}`);
  const d = await res.json();
  if (d.errors) throw new Error(d.errors[0]?.message || "GraphQL error");
  return d.data;
}

const server = new McpServer({ name: "mcp-linear", version: "1.0.0" });

server.tool("search_issues", "Search Linear issues.", {
  query: z.string(), first: z.number().min(1).max(50).default(10),
}, async ({ query, first }) => {
  const d = await gql(`query($q: String!, $first: Int!) { searchIssues(query: $q, first: $first) { nodes { id identifier title state { name } assignee { name } priority priorityLabel createdAt url } } }`, { q: query, first });
  return { content: [{ type: "text" as const, text: JSON.stringify(d.searchIssues?.nodes, null, 2) }] };
});

server.tool("get_issue", "Get issue details.", {
  issueId: z.string().describe("Issue identifier (e.g. 'ENG-123')"),
}, async ({ issueId }) => {
  const d = await gql(`query($id: String!) { issue(id: $id) { id identifier title description state { name } assignee { name } priority priorityLabel labels { nodes { name } } createdAt updatedAt url } }`, { id: issueId });
  return { content: [{ type: "text" as const, text: JSON.stringify(d.issue, null, 2) }] };
});

server.tool("create_issue", "Create a new issue.", {
  teamId: z.string(), title: z.string(), description: z.string().optional(),
  priority: z.number().min(0).max(4).optional().describe("0=none, 1=urgent, 2=high, 3=medium, 4=low"),
  assigneeId: z.string().optional(),
}, async ({ teamId, title, description, priority, assigneeId }) => {
  const input: any = { teamId, title };
  if (description) input.description = description;
  if (priority !== undefined) input.priority = priority;
  if (assigneeId) input.assigneeId = assigneeId;
  const d = await gql(`mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url } } }`, { input });
  return { content: [{ type: "text" as const, text: JSON.stringify(d.issueCreate, null, 2) }] };
});

server.tool("list_teams", "List teams.", {}, async () => {
  const d = await gql(`{ teams { nodes { id name key description } } }`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d.teams?.nodes, null, 2) }] };
});

server.tool("list_projects", "List projects.", { first: z.number().min(1).max(50).default(20) }, async ({ first }) => {
  const d = await gql(`query($first: Int!) { projects(first: $first) { nodes { id name state progress { percentComplete } lead { name } url } } }`, { first });
  return { content: [{ type: "text" as const, text: JSON.stringify(d.projects?.nodes, null, 2) }] };
});

server.tool("my_issues", "Get issues assigned to the authenticated user.", {
  first: z.number().min(1).max(50).default(20),
}, async ({ first }) => {
  const d = await gql(`query($first: Int!) { viewer { assignedIssues(first: $first, orderBy: updatedAt) { nodes { identifier title state { name } priority priorityLabel url } } } }`, { first });
  return { content: [{ type: "text" as const, text: JSON.stringify(d.viewer?.assignedIssues?.nodes, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
