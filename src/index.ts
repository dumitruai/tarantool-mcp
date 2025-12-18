#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TarantoolConnection } from "./tarantool.js";

const server = new McpServer({
  name: "tarantool-mcp",
  version: "1.0.0",
});

const tarantool = new TarantoolConnection();

// Configuration from environment variables
const config = {
  host: process.env.TARANTOOL_HOST ?? "localhost",
  port: parseInt(process.env.TARANTOOL_PORT ?? "3301", 10),
  username: process.env.TARANTOOL_USERNAME,
  password: process.env.TARANTOOL_PASSWORD,
};

// Eval tool
server.registerTool(
  "eval",
  {
    description: "Execute Lua code on Tarantool",
    inputSchema: {
      code: z.string().describe("Lua code to execute"),
    },
  },
  async (args) => {
    const result = await tarantool.eval(args.code);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Call tool
server.registerTool(
  "call",
  {
    description: "Call a stored procedure on Tarantool",
    inputSchema: {
      func: z.string().describe("Function name to call"),
      args: z.array(z.unknown()).optional().describe("Arguments to pass to the function"),
    },
  },
  async (args) => {
    const result = await tarantool.call(args.func, args.args ?? []);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Select tool
server.registerTool(
  "select",
  {
    description: "Select data from a space",
    inputSchema: {
      space: z.string().describe("Space name or ID"),
      key: z.array(z.unknown()).optional().describe("Key values for selection"),
      index: z.string().optional().describe("Index name (default: primary)"),
      limit: z.number().optional().describe("Maximum number of tuples to return"),
      offset: z.number().optional().describe("Number of tuples to skip"),
    },
  },
  async (args) => {
    const result = await tarantool.select(args.space, args.key, args.index, args.limit, args.offset);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Insert tool
server.registerTool(
  "insert",
  {
    description: "Insert a tuple into a space",
    inputSchema: {
      space: z.string().describe("Space name or ID"),
      tuple: z.array(z.unknown()).describe("Tuple to insert"),
    },
  },
  async (args) => {
    const result = await tarantool.insert(args.space, args.tuple);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Replace tool
server.registerTool(
  "replace",
  {
    description: "Replace a tuple in a space (insert or update)",
    inputSchema: {
      space: z.string().describe("Space name or ID"),
      tuple: z.array(z.unknown()).describe("Tuple to replace"),
    },
  },
  async (args) => {
    const result = await tarantool.replace(args.space, args.tuple);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Update tool
server.registerTool(
  "update",
  {
    description: "Update a tuple in a space",
    inputSchema: {
      space: z.string().describe("Space name or ID"),
      key: z.array(z.unknown()).describe("Key of the tuple to update"),
      operations: z.array(z.unknown()).describe('Update operations (e.g., [["=", 1, "new_value"]])'),
    },
  },
  async (args) => {
    const result = await tarantool.update(args.space, args.key, args.operations);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Delete tool
server.registerTool(
  "delete",
  {
    description: "Delete a tuple from a space",
    inputSchema: {
      space: z.string().describe("Space name or ID"),
      key: z.array(z.unknown()).describe("Key of the tuple to delete"),
    },
  },
  async (args) => {
    const result = await tarantool.delete(args.space, args.key);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// List spaces tool
server.registerTool(
  "list_spaces",
  {
    description: "List all spaces in the database",
  },
  async () => {
    const result = await tarantool.listSpaces();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

async function main() {
  // Connect to Tarantool on startup
  await tarantool.connect(config.host, config.port, config.username, config.password);
  console.error(`Connected to Tarantool at ${config.host}:${config.port}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tarantool MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
