import { Annotation, StateGraph } from '@langchain/langgraph';
import { vectorStore } from '../db/config.js';
import { llm } from '../ai/index.js';
import { identifyQuestionCategory, evaluateContextRelevance, validateAnswerQuality, needsHumanHelp, reorderDocumentsByRelevance } from '../utils/categoryUtils.js';
import { createRagPromptTemplate, createConversationalRagPromptTemplate, createRefinementPromptTemplate, generateHumanHandoffMessage } from '../utils/prompts.js';
// Define the enhanced state annotation for our application
const StateAnnotation = Annotation.Root({
    // Input state
    question: (Annotation), // User's question
    history: (Annotation), // Conversation history
    sessionId: (Annotation), // Session identifier
    // Processing state
    category: (Annotation), // Identified category
    context: (Annotation), // Retrieved documents
    contextRelevance: (Annotation), // Relevance score
    // Output state
    answer: (Annotation), // Generated answer
    needsRefinement: (Annotation), // Whether answer needs improvement
    needsHumanAssistance: (Annotation), // Whether to suggest human handoff
    finalAnswer: (Annotation), // Final processed answer
});
// Define the enhanced application steps
// Step 1: Categorize the question
const categorize = async (state) => {
    const category = identifyQuestionCategory(state.question);
    return { category: category.toString() };
};
// Step 2: Retrieve relevant documents
const retrieve = async (state) => {
    // Retrieve more documents than we need for better filtering
    const retrievedDocs = await vectorStore.similaritySearch(state.question, 8, // Get more documents initially
    state.category !== 'General' ? { category: state.category } : undefined);
    // Reorder documents by relevance to the question
    const orderedDocs = reorderDocumentsByRelevance(retrievedDocs, state.question);
    // Take only the top most relevant documents
    const selectedDocs = orderedDocs.slice(0, 4);
    // Evaluate context relevance for later use
    const relevance = evaluateContextRelevance(selectedDocs, state.question);
    return {
        context: selectedDocs,
        contextRelevance: relevance
    };
};
// Step 3: Generate answer based on retrieved documents
const generate = async (state) => {
    // Format the context with source attribution
    const formattedContext = state.context.map(doc => {
        const source = doc.metadata?.source || 'Company Document';
        return `Source: ${source}\n${doc.pageContent}`;
    }).join('\n\n');
    // Choose the appropriate prompt template based on history
    const promptTemplate = state.history?.length
        ? createConversationalRagPromptTemplate()
        : createRagPromptTemplate();
    // Format history if available
    const historyText = state.history?.length
        ? state.history.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
        : '';
    // Create prompt with all available information
    const messages = await promptTemplate.invoke({
        question: state.question,
        context: formattedContext,
        history: historyText
    });
    // Generate response with LLM
    const response = await llm.invoke(messages);
    return { answer: response.content };
};
// Step 4: Validate the answer quality
const validate = async (state) => {
    // Check if the answer is acceptable
    const isValid = validateAnswerQuality(state.answer, state.question);
    // Check if human assistance is needed
    const humanHelp = needsHumanHelp(state.question, state.context, state.answer);
    return {
        needsRefinement: !isValid,
        needsHumanAssistance: humanHelp
    };
};
// Step 5: Refine the answer if needed
const refine = async (state) => {
    // If refinement not needed, skip
    if (!state.needsRefinement) {
        return { finalAnswer: state.answer };
    }
    // Create refinement prompt
    const refinementPrompt = createRefinementPromptTemplate();
    // Format context for refinement
    const contextText = state.context.map(doc => doc.pageContent).join('\n\n');
    // Invoke refinement prompt
    const refinementMessages = await refinementPrompt.invoke({
        question: state.question,
        context: contextText,
        answer: state.answer
    });
    // Generate improved answer
    const refinedResponse = await llm.invoke(refinementMessages);
    return { finalAnswer: refinedResponse.content };
};
// Step 6: Handle human assistance if needed
const handleHumanAssistance = async (state) => {
    // If human assistance not needed, use the refined or original answer
    if (!state.needsHumanAssistance) {
        return {
            finalAnswer: state.finalAnswer || state.answer
        };
    }
    // Generate human handoff message
    const handoffMessage = generateHumanHandoffMessage(state.question);
    return { finalAnswer: handoffMessage };
};
// Define conditional edges for the graph
const shouldRefine = (state) => {
    return state.needsRefinement ? 'refine' : 'handleHumanAssistance';
};
// Create and compile the enhanced state graph
export const graph = new StateGraph(StateAnnotation)
    .addNode('categorize', categorize)
    .addNode('retrieve', retrieve)
    .addNode('generate', generate)
    .addNode('validate', validate)
    .addNode('refine', refine)
    .addNode('handleHumanAssistance', handleHumanAssistance)
    .addEdge('__start__', 'categorize')
    .addEdge('categorize', 'retrieve')
    .addEdge('retrieve', 'generate')
    .addEdge('generate', 'validate')
    .addConditionalEdges('validate', shouldRefine, {
    'refine': 'refine',
    'handleHumanAssistance': 'handleHumanAssistance'
})
    .addEdge('refine', 'handleHumanAssistance')
    .addEdge('handleHumanAssistance', '__end__')
    .compile();
