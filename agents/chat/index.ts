import { MODEL_CONFIG } from '../_model';
import { TOOLS, executeTool } from '../_tools';

export async function onRequest(context: any) {
  const { request, env, store } = context;
  const signal = request.signal;

  // Get conversation ID from header
  const conversationId = request.headers.get('makers-conversation-id') || `conv_${Date.now()}`;

  try {
    const body = await request.json();
    const userMessage = body.message || '';

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'กรุณาส่งข้อความ' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load conversation history from store
    let history: any[] = await store.get(conversationId) as any[] || [];

    // Add user message to history
    history.push({ role: 'user', content: userMessage });

    // Build messages for LLM
    const messages = history.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // Call LLM via AI Gateway
    const apiKey = env.AI_GATEWAY_API_KEY || '';
    const baseUrl = env.AI_GATEWAY_BASE_URL || 'https://api.anthropic.com';
    const model = env.AI_GATEWAY_MODEL || MODEL_CONFIG.model;

    const llmResponse = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: MODEL_CONFIG.maxTokens,
        system: MODEL_CONFIG.systemPrompt,
        messages,
        tools: TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        })),
      }),
      signal,
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      // Stream error as SSE
      const headers = {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      };

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(`data: ${JSON.stringify({ type: 'error', content: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })}\n\n`);
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
        },
      });

      return new Response(stream, { headers });
    }

    const llmData = await llmResponse.json();

    // Process tool calls if present
    let assistantContent = '';
    const contentBlocks = llmData.content || [];

    for (const block of contentBlocks) {
      if (block.type === 'text') {
        assistantContent += block.text;
      } else if (block.type === 'tool_use') {
        const toolResult = await executeTool(block.name, block.input, env);
        assistantContent += `\n${toolResult}`;
        // Add tool result to history for context
        history.push({ role: 'assistant', content: block.name, toolUse: block });
        history.push({ role: 'user', content: toolResult, toolResult: true });
      }
    }

    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantContent });

    // Save history to store (bounded - keep last 20 messages)
    if (history.length > 20) {
      history = history.slice(history.length - 20);
    }
    await store.put(conversationId, history);

    // Stream response as SSE
    const headers = {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    };

    const stream = new ReadableStream({
      start(controller) {
        // Send conversation ID first
        controller.enqueue(`data: ${JSON.stringify({ type: 'conversation_id', conversationId })}\n\n`);

        // Stream the response text
        const words = assistantContent.split('');
        let i = 0;
        const interval = setInterval(() => {
          if (signal?.aborted || i >= words.length) {
            clearInterval(interval);
            controller.enqueue('data: [DONE]\n\n');
            controller.close();
            return;
          }
          const chunk = words.slice(i, i + 3).join('');
          i += 3;
          controller.enqueue(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
        }, 30);
      },
    });

    return new Response(stream, { headers });
  } catch (err: any) {
    if (signal?.aborted) {
      return new Response(JSON.stringify({ message: 'หยุดการตอบแล้ว' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
