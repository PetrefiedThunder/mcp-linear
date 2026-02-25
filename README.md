# mcp-linear

Search issues, create tickets, list projects, and manage work in Linear.

## Tools

| Tool | Description |
|------|-------------|
| `search_issues` | Search Linear issues. |
| `get_issue` | Get issue details. |
| `create_issue` | Create a new issue. |
| `list_teams` | List teams. |
| `list_projects` | List projects. |
| `my_issues` | Get issues assigned to the authenticated user. |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `LINEAR_API_KEY` | Yes | Linear personal API key |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-linear.git
cd mcp-linear
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linear": {
      "command": "node",
      "args": ["/path/to/mcp-linear/dist/index.js"],
      "env": {
        "LINEAR_API_KEY": "your-linear-api-key"
      }
    }
  }
}
```

## Usage with npx

```bash
npx mcp-linear
```

## License

MIT
