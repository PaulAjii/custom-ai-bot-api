import { MongoClient } from 'mongodb';
import { Document } from '@langchain/core/documents';
import 'dotenv/config';

// MongoDB connection
const { MONGO_URI, MONGO_DB } = process.env;
let client: MongoClient | null = null;
let analyticsCollection: any = null;

/**
 * Analytics interface for interaction data
 */
interface ChatAnalytics {
  timestamp: Date;
  sessionId: string;
  question: string;
  answer: string;
  contextSources: string[];
  responseTimeMs: number;
  humanAssistanceNeeded: boolean;
  category: string;
  relevanceScore: number;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Initializes the analytics system
 * Returns true if analytics was successfully initialized, false otherwise
 */
export async function initAnalytics(): Promise<boolean> {
  try {
    if (!MONGO_URI || !MONGO_DB) {
      return false;
    }

    // Initialize MongoDB client
    client = new MongoClient(MONGO_URI);
    
    // Test connection
    await client.connect();
    
    // Set up analytics collection
    analyticsCollection = client.db(MONGO_DB).collection('analytics');
    
    // Create indexes for better query performance
    await analyticsCollection.createIndex({ timestamp: 1 });
    await analyticsCollection.createIndex({ sessionId: 1 });
    await analyticsCollection.createIndex({ humanAssistanceNeeded: 1 });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
    client = null;
    analyticsCollection = null;
    return false;
  }
}

/**
 * Properly close the analytics MongoDB connection
 */
export async function closeAnalyticsConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.error('Error closing analytics MongoDB connection:', error);
    } finally {
      client = null;
      analyticsCollection = null;
    }
  }
}

/**
 * Logs chat interaction for analytics and improvement
 */
export async function logInteraction(
  sessionId: string,
  question: string,
  answer: string,
  context: Document[],
  responseTime: number,
  humanAssistanceNeeded: boolean = false,
  category: string = 'General',
  relevanceScore: number = 0,
  userInfo: { userAgent?: string; ipAddress?: string } = {}
): Promise<void> {
  try {
    // Check if analytics is enabled
    if (!analyticsCollection) {
      return;
    }
    
    const contextSources = context.map(doc => 
      doc.metadata?.source || 'Unknown Source'
    );
    
    const analyticsData: ChatAnalytics = {
      timestamp: new Date(),
      sessionId,
      question,
      answer,
      contextSources,
      responseTimeMs: responseTime,
      humanAssistanceNeeded,
      category,
      relevanceScore,
      userAgent: userInfo.userAgent,
      ipAddress: userInfo.ipAddress
    };
    
    // Insert analytics data
    await analyticsCollection.insertOne(analyticsData);
  } catch (error) {
    // Don't let analytics failures affect the main application
    console.error('Failed to log analytics:', error);
  }
}

/**
 * Gets summary statistics for the chatbot
 */
export async function getAnalyticsSummary(days: number = 7): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get analytics from the specified time period
    const analyticsData = await analyticsCollection
      .find({ timestamp: { $gte: startDate } })
      .toArray();
    
    if (!analyticsData.length) {
      return {
        period: `Last ${days} days`,
        totalInteractions: 0,
        message: 'No interactions recorded in this period'
      };
    }
    
    // Calculate summary statistics
    const totalInteractions = analyticsData.length;
    const avgResponseTime = analyticsData.reduce(
      (sum, item) => sum + item.responseTimeMs, 0
    ) / totalInteractions;
    
    const humanAssistanceCount = analyticsData.filter(
      item => item.humanAssistanceNeeded
    ).length;
    
    const categoryCounts = analyticsData.reduce((counts, item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, {});
    
    // Return summary data
    return {
      period: `Last ${days} days`,
      totalInteractions,
      avgResponseTimeMs: avgResponseTime,
      humanAssistancePercentage: (humanAssistanceCount / totalInteractions) * 100,
      categoryCounts
    };
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return null;
  }
}

/**
 * Gets recent questions that required human assistance
 * Useful for identifying gaps in the bot's knowledge
 */
export async function getHumanAssistanceQuestions(limit: number = 10): Promise<string[]> {
  try {
    if (!analyticsCollection) {
      return [];
    }
    
    const results = await analyticsCollection
      .find({ humanAssistanceNeeded: true })
      .sort({ timestamp: -1 })
      .limit(limit)
      .project({ question: 1 })
      .toArray();
      
    return results.map(item => item.question);
  } catch (error) {
    console.error('Failed to get human assistance questions:', error);
    return [];
  }
} 