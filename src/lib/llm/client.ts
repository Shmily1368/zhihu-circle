import { LLMAnalysisResult } from "../zhihu/types";
import { LLM_SYSTEM_PROMPT } from "./prompts";

export async function callLLM(promptData: any): Promise<LLMAnalysisResult> {
    const apiKey = process.env.LLM_API_KEY;
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';

    if (!apiKey) {
        throw new Error('LLM_API_KEY is not configured');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: LLM_SYSTEM_PROMPT },
                { role: 'user', content: JSON.stringify(promptData) }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
        throw new Error('Empty response from LLM');
    }

    return JSON.parse(content) as LLMAnalysisResult;
}
