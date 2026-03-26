"""AI agent endpoint — Claude-powered Kubernetes assistant."""

import json
from collections.abc import AsyncGenerator

import anthropic
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from app.config import settings
from app.services.ai_tools import K8S_TOOLS, execute_tool

router = APIRouter(prefix="/api/ai", tags=["ai"])

SYSTEM_PROMPT = """You are Kubosun, an AI assistant for Kubernetes cluster management.

You have access to tools that let you interact with the user's Kubernetes cluster.
Always use the tools to get real data — never make up resource names or statuses.

Guidelines:
- When listing resources, present them in a clear, readable format
- For destructive actions (delete, apply), always use dry_run=true first and show what would happen
- Only proceed with actual changes after the user explicitly confirms
- If you're unsure about something, ask the user
- Be concise but thorough in your explanations
- When diagnosing issues, check events and logs proactively

For API paths:
- Core resources: api/v1/pods, api/v1/namespaces/default/services
- Apps: apis/apps/v1/namespaces/default/deployments
- Networking: apis/networking.k8s.io/v1/namespaces/default/ingresses
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    namespace: str = "default"


@router.post("/chat")
async def chat(request: ChatRequest, raw_request: Request) -> StreamingResponse:
    """Stream an AI chat response with tool use."""
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")

    user_token = getattr(raw_request.state, "user_token", None)
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    # Build conversation messages
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    system = SYSTEM_PROMPT + f"\n\nCurrent namespace context: {request.namespace}"

    async def generate() -> AsyncGenerator[str, None]:
        # Tool use loop — keep going until Claude produces a final text response
        current_messages = list(messages)

        while True:
            response = client.messages.create(
                model=settings.ai_model,
                system=system,
                messages=current_messages,
                tools=K8S_TOOLS,
                max_tokens=4096,
            )

            # Process response content blocks
            has_tool_use = False
            tool_results = []

            for block in response.content:
                if block.type == "text":
                    yield f"data: {json.dumps({'type': 'text', 'content': block.text})}\n\n"
                elif block.type == "tool_use":
                    has_tool_use = True
                    # Tell frontend which tool is being called
                    yield f"data: {json.dumps({'type': 'tool_call', 'tool': block.name, 'input': block.input})}\n\n"

                    # Execute the tool with user's token for proper RBAC
                    result = await execute_tool(block.name, block.input, user_token=user_token)

                    # Send tool result to frontend
                    yield f"data: {json.dumps({'type': 'tool_result', 'tool': block.name, 'result': result})}\n\n"

                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        }
                    )

            if not has_tool_use:
                # No more tool calls — we're done
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                break

            # Continue the conversation with tool results
            current_messages.append({"role": "assistant", "content": response.content})
            current_messages.append({"role": "user", "content": tool_results})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
