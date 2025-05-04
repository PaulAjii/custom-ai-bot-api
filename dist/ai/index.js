import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
export const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.7,
    maxTokens: 1024,
    verbose: false,
});
export const embedding = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
});
