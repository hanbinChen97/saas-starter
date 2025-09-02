import { NextRequest, NextResponse } from 'next/server';

// In-memory set to track processed event IDs (MVP implementation)
// In production, this should use Redis or a database
const processedEvents = new Set<string>();

interface TriggerPayload {
  id: string;
  roomId: string;
  sender: string;
  body: string;
  ts: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload: TriggerPayload = await request.json();
    
    // Validate payload
    if (!payload.id || !payload.roomId || !payload.sender || !payload.body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate events (idempotency)
    if (processedEvents.has(payload.id)) {
      return NextResponse.json(
        { message: 'Event already processed', eventId: payload.id },
        { status: 200 }
      );
    }

    // Add to processed events
    processedEvents.add(payload.id);

    // MVP: Just log the event (can be extended to queue processing)
    console.log('Matrix Event Triggered:', {
      eventId: payload.id,
      room: payload.roomId,
      sender: payload.sender,
      message: payload.body,
      timestamp: new Date(payload.ts).toISOString(),
    });

    // Check for slash commands or specific patterns
    const messageBody = payload.body.trim();
    let response: any = {
      eventId: payload.id,
      processed: true,
      timestamp: new Date().toISOString(),
    };

    // Parse potential commands
    if (messageBody.startsWith('/')) {
      const commandResult = parseSlashCommand(messageBody, payload);
      response.command = commandResult;
      console.log('Slash Command Detected:', commandResult);
    } else if (messageBody.startsWith('{') && messageBody.endsWith('}')) {
      try {
        const jsonCommand = JSON.parse(messageBody);
        const jsonResult = parseJsonCommand(jsonCommand, payload);
        response.jsonCommand = jsonResult;
        console.log('JSON Command Detected:', jsonResult);
      } catch (error) {
        console.log('Invalid JSON command:', messageBody);
      }
    }

    // TODO: In production, add to job queue here (BullMQ/Redis)
    // await jobQueue.add('process-matrix-event', payload);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error processing Matrix trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Parse slash commands like "/build project=alpha" or "/deploy api=v2"
function parseSlashCommand(message: string, payload: TriggerPayload) {
  const parts = message.slice(1).split(' '); // Remove leading '/' and split
  const command = parts[0];
  const args: Record<string, string> = {};

  // Parse key=value pairs
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('=')) {
      const [key, value] = part.split('=', 2);
      args[key] = value;
    }
  }

  return {
    command,
    args,
    sender: payload.sender,
    room: payload.roomId,
    originalMessage: message,
  };
}

// Parse JSON commands like {"action": "run_report", "args": {...}}
function parseJsonCommand(jsonData: any, payload: TriggerPayload) {
  return {
    action: jsonData.action,
    args: jsonData.args || {},
    sender: payload.sender,
    room: payload.roomId,
    originalData: jsonData,
  };
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'matrix-trigger',
    processedEvents: processedEvents.size,
    timestamp: new Date().toISOString(),
  });
}