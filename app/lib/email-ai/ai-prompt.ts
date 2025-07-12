// AI Prompt Templates for Email Reply Generation
import { z } from 'zod';

export interface EmailReplyRequest {
  emailContent: string;
  emailSubject: string;
  emailFrom: string;
  emailTo: string;
  replyContext?: string;
  conversationHistory?: ConversationMessage[];
  userFeedback?: string;
  currentDraft?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface EmailReplyResponse {
  draftReply: string;
  modifications: EmailModification[];
  aiResponse?: string; // Response to show in chat when user provides feedback
}

export interface EmailModification {
  id: string;
  type: 'tone' | 'length' | 'formality' | 'language' | 'custom';
  title: string;
  description: string;
  replacement: string;
}

// Zod schemas for validating LLM responses
export const EmailModificationSchema = z.object({
  id: z.string(),
  type: z.enum(['tone', 'length', 'formality', 'language', 'custom']),
  title: z.string(),
  description: z.string(),
  replacement: z.string().min(1, 'Replacement text cannot be empty')
});

export const EmailReplyResponseSchema = z.object({
  draftReply: z.string().min(1, 'Draft reply cannot be empty'),
  modifications: z.array(EmailModificationSchema).length(6, 'Exactly 6 modifications are required'),
  aiResponse: z.string().optional()
});

// Validation function for LLM responses
export function validateEmailReplyResponse(data: any): EmailReplyResponse {
  try {
    return EmailReplyResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid LLM response format: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

export function generateEmailReplyPrompt(request: EmailReplyRequest): string {
  const isIterativeRequest = (request.conversationHistory && request.conversationHistory.length > 0) || 
                             (!!request.userFeedback && !!request.currentDraft);
  
  // Detect the primary language of the original email
  const detectLanguage = (text: string): 'german' | 'english' => {
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'mit', 'für', 'von', 'zu', 'auf', 'eine', 'einen', 'einer', 'sich', 'nicht', 'auch', 'nach', 'bei', 'über', 'durch', 'wird', 'werden', 'haben', 'hatte', 'sind', 'war', 'wurden', 'können', 'sollte', 'würde', 'möchte', 'vielen', 'dank', 'liebe', 'grüße', 'freundliche'];
    const textLower = text.toLowerCase();
    const germanMatches = germanWords.filter(word => textLower.includes(word)).length;
    return germanMatches > 3 ? 'german' : 'english';
  };
  
  const primaryLanguage = detectLanguage(request.emailContent + ' ' + request.emailSubject);
  const alternativeLanguage = primaryLanguage === 'german' ? 'english' : 'german';
  
  let prompt = `You are an AI assistant helping to generate professional email replies. Your task is to:

1. Generate ONE high-quality draft reply to the email in the SAME LANGUAGE as the original email
2. Provide 4 alternative modifications that the user can choose from, including one in the alternative language

EMAIL TO REPLY TO:
Subject: ${request.emailSubject}
From: ${request.emailFrom}
To: ${request.emailTo}
Content: ${request.emailContent}

DETECTED PRIMARY LANGUAGE: ${primaryLanguage}
ALTERNATIVE LANGUAGE OPTION: ${alternativeLanguage}

${request.replyContext ? `Additional Context: ${request.replyContext}` : ''}`;

  // Add conversation history if this is an iterative request
  if (isIterativeRequest) {
    // Always show the current draft first (if available)
    if (request.currentDraft) {
      prompt += `

CURRENT DRAFT REPLY:
${request.currentDraft}`;
    }

    // Add conversation history if exists
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      prompt += `

CONVERSATION HISTORY:
${request.conversationHistory.map(msg => 
  `${msg.role.toUpperCase()}: ${msg.content}`
).join('\n')}`;
    }

    if (request.userFeedback) {
      prompt += `

USER FEEDBACK/REQUEST:
${request.userFeedback}

IMPORTANT: Please carefully analyze the user's feedback and update the email draft accordingly. ${request.currentDraft ? 'Modify the CURRENT DRAFT REPLY shown above' : 'Create a new draft'} based on the user's specific request. The user's feedback may include:
- Tone adjustments (more casual, formal, friendly, professional, etc.)
- Content changes (add information, remove parts, clarify points, etc.)
- Length modifications (make it shorter, more detailed, etc.)
- Language style (more direct, polite, assertive, etc.)
- Specific wording preferences or corrections

Your "aiResponse" should specifically acknowledge what the user asked for and briefly explain the key changes you made compared to the ${request.currentDraft ? 'current draft' : 'initial approach'}. Be conversational and show that you understood their request.`;
    }
  }

  prompt += `

Please respond with a JSON object in the following format:
{
  "draftReply": "Your main draft reply here (professional, concise, and contextually appropriate) - in ${primaryLanguage}",
  "aiResponse": "${isIterativeRequest ? 'A specific, conversational response acknowledging the user\'s request and explaining the key changes you made. Examples: "I\'ve made the tone more casual by using friendlier language and removing formal phrases", "I\'ve shortened the email while keeping the main points about [specific topic]", "I\'ve added more details about [specific aspect] as you requested"' : 'null or omit this field for initial generation'}",
  "modifications": [
    {
      "id": "lang_english",
      "type": "language",
      "title": "English",
      "description": "Reply in English",
      "replacement": "Complete reply in English with same tone and content"
    },
    {
      "id": "lang_german",
      "type": "language", 
      "title": "Deutsch",
      "description": "Reply in German",
      "replacement": "Complete reply in German with same tone and content"
    },
    {
      "id": "tone_formal",
      "type": "formality",
      "title": "Formal",
      "description": "Professional and formal tone",
      "replacement": "Reply with formal, professional language"
    },
    {
      "id": "tone_casual",
      "type": "tone",
      "title": "Casual",
      "description": "Friendly and informal tone", 
      "replacement": "Reply with casual, friendly language"
    },
    {
      "id": "tone_concise",
      "type": "length",
      "title": "Concise",
      "description": "Brief and to the point",
      "replacement": "Shorter, more concise version of the reply"
    },
    {
      "id": "tone_detailed",
      "type": "custom",
      "title": "Detailed",
      "description": "More comprehensive response",
      "replacement": "Longer, more detailed version of the reply"
    }
  ]
}

Guidelines:
- Keep the main draft professional but personable
- Ensure all replies are contextually relevant to the original email
- Include appropriate greeting and closing in the detected language
- Maintain a helpful and respectful tone
- IMPORTANT: Generate the main draft reply in ${primaryLanguage} (the detected language of the original email)
- IMPORTANT: Generate EXACTLY 6 modifications as specified above:
  * 2 Language options: One in English, one in German (both with same tone as main draft)
  * 4 Tone/Style options: Formal, Casual, Concise, Detailed (all in same language as main draft)
- For German emails, use appropriate German email conventions (e.g., "Liebe/r", "Mit freundlichen Grüßen")
- For English emails, use standard English email conventions (e.g., "Dear", "Best regards")
- Consider the relationship implied by the email tone (formal business, colleague, etc.)
- Make each modification meaningfully different from the main draft
- Ensure JSON is valid and properly escaped
${isIterativeRequest ? `- For iterative requests:
  * Carefully read and understand the user's specific feedback
  * Make targeted changes that directly address their request
  * In "aiResponse", be specific about what you changed and why
  * Use conversational language like "I've...", "I changed...", "I added..."
  * Reference specific elements the user mentioned
  * If the request is unclear, acknowledge what you understood and what changes you made
  * Show that you're responsive to their needs and preferences` : ''}

Return ONLY the JSON object, no additional text or formatting.`;

  return prompt;
}

export const SYSTEM_PROMPT = `You are a professional email assistant. You help users compose thoughtful, appropriate email replies by generating draft responses and offering meaningful alternatives. Always respond with valid JSON format as specified in the user's request.`;