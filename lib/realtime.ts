import { client, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { RealtimeResponseEvent } from 'appwrite';
import type { UserSettings, ColumnDefinition, ColumnValue, SlashCommand } from './types';

export type SubscriptionCallback<T> = (data: T) => void;

export class RealtimeService {
  private subscriptions: Map<string, () => void> = new Map();

  // Subscribe to user settings changes
  subscribeToUserSettings(
    userId: string, 
    callback: SubscriptionCallback<UserSettings>
  ): () => void {
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.USER_SETTINGS}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response: RealtimeResponseEvent<any>) => {
      // Only process events for the current user
      if (response.payload?.userId === userId) {
        if (response.events.includes('databases.*.collections.*.documents.*.update') ||
            response.events.includes('databases.*.collections.*.documents.*.create')) {
          
          const settings: UserSettings = {
            id: parseInt(response.payload.$id, 36),
            elementDelimiter: response.payload.elementDelimiter,
            rowEndDelimiter: response.payload.rowEndDelimiter,
            globalContext: response.payload.globalContext,
            createdAt: response.payload.$createdAt,
            updatedAt: response.payload.$updatedAt,
          };
          
          callback(settings);
        }
      }
    });

    // Store subscription for cleanup
    const subscriptionId = `userSettings_${userId}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  // Subscribe to column definitions changes
  subscribeToColumnDefinitions(
    userId: string,
    callback: SubscriptionCallback<ColumnDefinition[]>
  ): () => void {
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.COLUMN_DEFINITIONS}.documents`;
    
    const unsubscribe = client.subscribe(channel, async (response: RealtimeResponseEvent<any>) => {
      // Only process events for the current user
      if (response.payload?.userId === userId) {
        try {
          // Refetch all column definitions to maintain proper order
          const updatedColumns = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.COLUMN_DEFINITIONS,
            [`equal("userId", "${userId}")`, 'orderAsc("sortOrder")']
          );

          const columns: ColumnDefinition[] = updatedColumns.documents.map(doc => ({
            id: parseInt(doc.$id, 36),
            name: doc.name,
            description: doc.description,
            format: doc.format,
            sortOrder: doc.sortOrder,
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
          }));

          callback(columns);
        } catch (error) {
          console.error('Failed to refetch column definitions:', error);
        }
      }
    });

    const subscriptionId = `columnDefinitions_${userId}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  // Subscribe to slash commands changes
  subscribeToSlashCommands(
    userId: string,
    callback: SubscriptionCallback<SlashCommand[]>
  ): () => void {
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.SLASH_COMMANDS}.documents`;
    
    const unsubscribe = client.subscribe(channel, async (response: RealtimeResponseEvent<any>) => {
      // Only process events for the current user
      if (response.payload?.userId === userId) {
        try {
          // Refetch all slash commands
          const updatedCommands = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.SLASH_COMMANDS,
            [`equal("userId", "${userId}")`]
          );

          const commands: SlashCommand[] = updatedCommands.documents.map(doc => ({
            id: parseInt(doc.$id, 36),
            command: doc.command,
            expansion: doc.expansion,
            description: doc.description,
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
          }));

          callback(commands);
        } catch (error) {
          console.error('Failed to refetch slash commands:', error);
        }
      }
    });

    const subscriptionId = `slashCommands_${userId}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  // Subscribe to column values changes
  subscribeToColumnValues(
    userId: string,
    callback: SubscriptionCallback<Record<number, ColumnValue[]>>
  ): () => void {
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.COLUMN_VALUES}.documents`;
    
    const unsubscribe = client.subscribe(channel, async (response: RealtimeResponseEvent<any>) => {
      // Only process events for the current user
      if (response.payload?.userId === userId) {
        try {
          // Refetch all column values
          const updatedValues = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.COLUMN_VALUES,
            [`equal("userId", "${userId}")`]
          );

          // Group by column ID
          const groupedValues: Record<number, ColumnValue[]> = {};
          updatedValues.documents.forEach(doc => {
            const columnId = parseInt(doc.columnDefinitionId, 36);
            const value: ColumnValue = {
              id: parseInt(doc.$id, 36),
              columnId,
              value: doc.value,
              description: doc.description,
              createdAt: doc.$createdAt,
              updatedAt: doc.$updatedAt,
            };

            if (!groupedValues[columnId]) {
              groupedValues[columnId] = [];
            }
            groupedValues[columnId].push(value);
          });

          callback(groupedValues);
        } catch (error) {
          console.error('Failed to refetch column values:', error);
        }
      }
    });

    const subscriptionId = `columnValues_${userId}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();