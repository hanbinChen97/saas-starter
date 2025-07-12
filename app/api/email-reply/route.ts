import { NextRequest, NextResponse } from 'next/server';
import { generateEmailReply } from '@/app/lib/email-ai/email-reply-service';
import { testAzureOpenAIConnection } from '@/app/lib/llm/azure-client';
import { EmailReplyRequest, validateEmailReplyResponse } from '@/app/lib/email-ai/ai-prompt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EmailReplyRequest;
    
    // Validate required fields for initial request
    if (!body.emailContent || !body.emailSubject || !body.emailFrom) {
      return NextResponse.json(
        { error: 'Missing required fields: emailContent, emailSubject, emailFrom' },
        { status: 400 }
      );
    }

    // For iterative requests, we also need user feedback
    const isIterativeRequest = body.conversationHistory && body.conversationHistory.length > 0;
    if (isIterativeRequest && !body.userFeedback) {
      return NextResponse.json(
        { error: 'Missing userFeedback for iterative request' },
        { status: 400 }
      );
    }

    // Generate the email reply using Azure OpenAI
    const replyData = await generateEmailReply(body);
    
    // Validate the response from LLM before returning to client
    try {
      const validatedResponse = validateEmailReplyResponse(replyData);
      return NextResponse.json(validatedResponse);
    } catch (validationError) {
      console.error('LLM response validation failed:', validationError);
      return NextResponse.json(
        { 
          error: 'Invalid AI response format',
          details: validationError instanceof Error ? validationError.message : 'Validation failed'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email reply generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate email reply',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test the Azure OpenAI connection
    const testResult = await testAzureOpenAIConnection();
    
    return NextResponse.json({
      status: testResult.success ? 'connected' : 'failed',
      timestamp: new Date().toISOString(),
      ...testResult
    });
  } catch (error) {
    console.error('Connection test error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}