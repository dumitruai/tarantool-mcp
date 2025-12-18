# tarantool-mcp

A Model Context Protocol (MCP) server for managing [Tarantool](https://www.tarantool.io/) databases. This server enables AI assistants like Claude to interact with Tarantool instances, execute Lua code, and perform CRUD operations on spaces.

## Installation

### Using npx (recommended)

```bash
npx tarantool-mcp
```

### Global installation

```bash
npm install -g tarantool-mcp
tarantool-mcp
```

### From source

```bash
git clone https://github.com/dumitruai/tarantool-mcp.git
cd tarantool-mcp
npm install
npm run build
npm start
```

## Configuration

The server connects to Tarantool automatically on startup using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TARANTOOL_HOST` | Tarantool server hostname | `localhost` |
| `TARANTOOL_PORT` | Tarantool server port | `3301` |
| `TARANTOOL_USERNAME` | Username for authentication | — |
| `TARANTOOL_PASSWORD` | Password for authentication | — |

## Usage with Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tarantool": {
      "command": "npx",
      "args": ["-y", "tarantool-mcp"],
      "env": {
        "TARANTOOL_HOST": "localhost",
        "TARANTOOL_PORT": "3301",
        "TARANTOOL_USERNAME": "admin",
        "TARANTOOL_PASSWORD": "your-password"
      }
    }
  }
}
```

## Available Tools

### eval

Execute Lua code directly on the Tarantool instance.

**Parameters:**
- `code` (string, required): Lua code to execute

**Example:**
```lua
return box.info.version
```

### call

Call a stored procedure/function on Tarantool.

**Parameters:**
- `func` (string, required): Function name to call
- `args` (array, optional): Arguments to pass to the function

**Example:**
```json
{
  "func": "box.space.users:count"
}
```

### select

Select data from a space.

**Parameters:**
- `space` (string, required): Space name
- `key` (array, optional): Key values for selection
- `index` (string, optional): Index name (default: primary)
- `limit` (number, optional): Maximum number of tuples to return
- `offset` (number, optional): Number of tuples to skip

**Example:**
```json
{
  "space": "users",
  "limit": 10
}
```

### insert

Insert a new tuple into a space.

**Parameters:**
- `space` (string, required): Space name
- `tuple` (array, required): Tuple to insert

**Example:**
```json
{
  "space": "users",
  "tuple": [1, "John Doe", "john@example.com"]
}
```

### replace

Replace a tuple in a space (insert or update if exists).

**Parameters:**
- `space` (string, required): Space name
- `tuple` (array, required): Tuple to replace

**Example:**
```json
{
  "space": "users",
  "tuple": [1, "Jane Doe", "jane@example.com"]
}
```

### update

Update a tuple in a space using update operations.

**Parameters:**
- `space` (string, required): Space name
- `key` (array, required): Key of the tuple to update
- `operations` (array, required): Update operations

**Operations format:** `[operator, field_number, value]`

Operators:
- `=` — assign
- `+` — add (numeric)
- `-` — subtract (numeric)
- `&` — bitwise AND
- `|` — bitwise OR
- `^` — bitwise XOR
- `!` — insert field
- `#` — delete field
- `:` — splice (substring replacement)

**Example:**
```json
{
  "space": "users",
  "key": [1],
  "operations": [["=", 2, "Updated Name"]]
}
```

### delete

Delete a tuple from a space.

**Parameters:**
- `space` (string, required): Space name
- `key` (array, required): Key of the tuple to delete

**Example:**
```json
{
  "space": "users",
  "key": [1]
}
```

### list_spaces

List all user-defined spaces in the database.

**Parameters:** None

**Returns:** Array of objects with `name` and `id` properties.

## Tarantool Setup

If you don't have Tarantool installed, you can quickly start it with Docker:

```bash
docker run -d \
  --name tarantool \
  -p 3301:3301 \
  -e TARANTOOL_USER_NAME=admin \
  -e TARANTOOL_USER_PASSWORD=secret \
  tarantool/tarantool:latest
```

Create a simple space for testing:

```lua
box.cfg{}
box.schema.space.create('users', {if_not_exists = true})
box.space.users:format({
    {name = 'id', type = 'unsigned'},
    {name = 'name', type = 'string'},
    {name = 'email', type = 'string'}
})
box.space.users:create_index('primary', {parts = {'id'}, if_not_exists = true})
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode (watch for changes)
npm run dev

# Start the server
npm start
```

## Requirements

- Node.js 18 or higher
- Tarantool 2.x or higher

## License

MIT
