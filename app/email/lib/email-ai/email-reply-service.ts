import { generateLLMResponse } from '@/app/lib/llm/azure-client';
import { EmailReplyRequest, EmailReplyResponse, generateEmailReplyPrompt, SYSTEM_PROMPT, validateEmailReplyResponse } from './ai-prompt';

/**
 * Generate email reply using Azure OpenAI
 */
export async function generateEmailReply(request: EmailReplyRequest): Promise<EmailReplyResponse> {
  try {
    const prompt = generateEmailReplyPrompt(request);
    
    const { text } = await generateLLMResponse({
      system: SYSTEM_PROMPT,
      prompt: prompt,
      maxTokens: 1500,
      temperature: 0.7,
      topP: 0.9,
    });

    if (!text) {
      throw new Error('No response received from Azure OpenAI');
    }

    // Parse and validate the JSON response
    try {
      const parsed = JSON.parse(text);
      
      // Debug log the raw response
      console.log('[DEBUG] Raw LLM response:', parsed);
      
      // Use Zod validation instead of manual checks
      const validatedResponse = validateEmailReplyResponse(parsed);

      // Debug log the validated response
      console.log('[DEBUG] Validated aiResponse:', validatedResponse.aiResponse);

      // Note: We now expect exactly 6 modifications (2 language + 4 tone/style)
      if (validatedResponse.modifications.length !== 6) {
        console.warn(`AI returned ${validatedResponse.modifications.length} modifications, expected 6`);
      }

      return validatedResponse;
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text);
      throw new Error('AI returned invalid JSON format');
    }
  } catch (error) {
    console.error('Email reply generation error:', error);
    
    // Return a fallback response if the API fails
    return {
      draftReply: "Thank you for your email. I'll review your message and get back to you soon.\n\nBest regards",
      aiResponse: request.userFeedback ? "I apologize, but I'm having trouble processing your request right now. Here's a basic response template." : undefined,
      modifications: [
        {
          id: 'lang_english',
          type: 'language',
          title: 'English',
          description: 'Reply in English',
          replacement: "Thank you for your email. I'll review your message and get back to you soon.\n\nBest regards",
        },
        {
          id: 'lang_german',
          type: 'language',
          title: 'Deutsch',
          description: 'Reply in German',
          replacement: "Vielen Dank für Ihre E-Mail. Ich werde Ihre Nachricht prüfen und mich bald bei Ihnen melden.\n\nMit freundlichen Grüßen",
        },
        {
          id: 'tone_formal',
          type: 'formality',
          title: 'Formal',
          description: 'Professional and formal tone',
          replacement: "Dear Sender,\n\nThank you for your correspondence. I have received your message and will provide a detailed response at my earliest convenience.\n\nSincerely",
        },
        {
          id: 'tone_casual',
          type: 'tone',
          title: 'Casual',
          description: 'Friendly and informal tone',
          replacement: "Thanks for reaching out! I'll take a look and get back to you.\n\nCheers",
        },
        {
          id: 'tone_concise',
          type: 'length',
          title: 'Concise',
          description: 'Brief and to the point',
          replacement: "Got it, thanks! Will respond soon.",
        },
        {
          id: 'tone_detailed',
          type: 'custom',
          title: 'Detailed',
          description: 'More comprehensive response',
          replacement: "Thank you very much for taking the time to reach out to me. I have carefully received and noted your message, and I want to assure you that I will give it my full attention. I will thoroughly review the contents and provide you with a comprehensive response as soon as possible.\n\nBest regards",
        },
      ],
    };
  }
}