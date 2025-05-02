import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';

export const llm = new ChatOpenAI({
	openAIApiKey: process.env.OPENAI_API_KEY,
});

export const embedding = new OpenAIEmbeddings({
	model: 'text-embedding-3-small',
});
