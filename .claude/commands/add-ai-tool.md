# Add an AI Agent Tool

Add a new tool that the Claude AI agent can use to interact with the Kubernetes cluster or perform other operations.

## Instructions

1. Ask the user for:
   - **Tool name** (snake_case, e.g., `get_node_metrics`, `scale_deployment`)
   - **Description** (what the tool does — Claude reads this to decide when to use it)
   - **Parameters** (name, type, description, required?)
   - **What it returns**

2. Read `backend/app/services/ai_tools.py` and:

   a. Add tool definition to the `K8S_TOOLS` array:
   ```python
   {
       "name": "tool_name",
       "description": "What this tool does",
       "input_schema": {
           "type": "object",
           "properties": { ... },
           "required": [...]
       }
   }
   ```

   b. Add dispatch entry in `_dispatch_tool()`:
   ```python
   elif tool_name == "tool_name":
       return await _tool_name(tool_input["param"], client)
   ```

   c. Implement the handler function:
   ```python
   async def _tool_name(param: str, api_client: ApiClient | None = None) -> dict:
       api_client = api_client or get_api_client()
       # Implementation here
       return {"result": ...}
   ```

3. For mutating operations (create, update, delete): always use `dry_run=True` by default.

4. Run `cd backend && ruff check . && pytest` to verify.

5. Commit with message: `Add {tool_name} AI tool for cluster management`

## Key files
- `backend/app/services/ai_tools.py` — K8S_TOOLS array + handlers
- `backend/app/services/k8s_client.py` — get_api_client, get_core_v1, etc.
- `backend/app/services/k8s_rbac.py` — check_permission for RBAC

## Conventions
- Tool names are snake_case
- Descriptions should be clear — Claude uses them to decide which tool to call
- Accept `api_client` parameter for per-user RBAC (passed from `_dispatch_tool`)
- Return dicts with clear field names
- Mutating tools default to dry_run=True for safety
- Long description strings are exempt from line length limits (E501)
