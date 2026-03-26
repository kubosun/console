'use client';

import { useCallback, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  result?: string;
}

export function useAIAgent(namespace: string = 'default') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: 'user', content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      setToolCalls([]);

      let assistantContent = '';

      try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            namespace,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI chat error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = JSON.parse(line.slice(6));

            if (data.type === 'text') {
              assistantContent += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = assistantContent;
                } else {
                  updated.push({ role: 'assistant', content: assistantContent });
                }
                return [...updated];
              });
            } else if (data.type === 'tool_call') {
              setToolCalls((prev) => [
                ...prev,
                { tool: data.tool, input: data.input },
              ]);
            } else if (data.type === 'tool_result') {
              setToolCalls((prev) =>
                prev.map((tc) =>
                  tc.tool === data.tool && !tc.result
                    ? { ...tc, result: data.result }
                    : tc,
                ),
              );
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${errorMsg}` },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, namespace],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setToolCalls([]);
  }, []);

  return { messages, sendMessage, isLoading, toolCalls, clearChat };
}
