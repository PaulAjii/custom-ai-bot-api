import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import { vectorStore } from './config.js';

const files = [
	'./src/db/data/Air Cargo Rates .docx',
	'./src/db/data/Barley.docx',
	'./src/db/data/Chickpeas.docx',
	'./src/db/data/Green_Lentils.docx',
	'./src/db/data/Millet.docx',
	'./src/db/data/Oats.docx',
	'./src/db/data/OOG Cargo Transport Services.docx',
	'./src/db/data/Peas.docx',
	'./src/db/data/Rail Logistics Services.docx',
	'./src/db/data/Red_Lentils.docx',
];

// Load the DOCX file and extract text from it
const loader = files.map((file) => new DocxLoader(file));

// const docs = loader.map(async (doc) => (await doc.load()));
let docs = [];

for (const doc of loader) {
	const loadedDocs = await doc.load();
	docs = docs.concat(loadedDocs);
}

// Split the loaded documents into smaller ch8unks
const splitter = new RecursiveCharacterTextSplitter({
	chunkSize: 1500,
	chunkOverlap: 300,
});

const splitDocs = await splitter.splitDocuments(docs);

// Add the split documents into the vector store
await vectorStore.addDocuments(splitDocs);
console.log('Documents added to the vector store successfully');
