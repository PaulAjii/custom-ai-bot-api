import { MongoClient } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { embedding } from '../ai/index.js';
import 'dotenv/config';

const { MONGO_URI, MONGO_DB, MONGO_COLLECTION } = process.env;

const client = new MongoClient(MONGO_URI);

const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);

export const vectorStore = new MongoDBAtlasVectorSearch(embedding, {
	collection: collection,
	indexName: 'vector_index',
	textKey: 'text',
	embeddingKey: 'embedding',
});
