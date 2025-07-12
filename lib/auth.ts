import { account, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Query, Permission, Role, ID } from 'appwrite';
import type { Models } from 'appwrite';

export interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: Record<string, any>;
}

export class AuthService {
  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      return null;
    }
  }

  // Register with email and password
  async register(email: string, password: string, name: string): Promise<Models.User<Models.Preferences>> {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      
      // Auto-login after registration
      await this.login(email, password);
      
      // Initialize default user settings
      await this.initializeUserSettings(user.$id);
      
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Login with email and password
  async login(email: string, password: string): Promise<Models.Session> {
    try {
      return await account.createEmailPasswordSession(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  // Login with magic link
  async loginWithMagicLink(email: string, url?: string): Promise<Models.Token> {
    try {
      return await account.createMagicURLToken(ID.unique(), email, url);
    } catch (error: any) {
      throw new Error(error.message || 'Magic link creation failed');
    }
  }

  // Complete magic link login
  async completeMagicLogin(userId: string, secret: string): Promise<Models.Session> {
    try {
      return await account.createSession(userId, secret);
    } catch (error: any) {
      throw new Error(error.message || 'Magic link login failed');
    }
  }

  // Create anonymous session
  async createAnonymousSession(): Promise<Models.Session> {
    try {
      return await account.createAnonymousSession();
    } catch (error: any) {
      throw new Error(error.message || 'Anonymous session creation failed');
    }
  }

  // Convert anonymous account to regular account
  async convertAnonymousAccount(email: string, password: string): Promise<Models.User<Models.Preferences>> {
    try {
      return await account.updateEmail(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Account conversion failed');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  }

  // Logout from all sessions
  async logoutAll(): Promise<void> {
    try {
      await account.deleteSessions();
    } catch (error: any) {
      throw new Error(error.message || 'Logout from all sessions failed');
    }
  }

  // Send password recovery email
  async sendPasswordRecovery(email: string, url: string): Promise<Models.Token> {
    try {
      return await account.createRecovery(email, url);
    } catch (error: any) {
      throw new Error(error.message || 'Password recovery failed');
    }
  }

  // Complete password recovery
  async completePasswordRecovery(userId: string, secret: string, password: string): Promise<Models.Token> {
    try {
      return await account.updateRecovery(userId, secret, password);
    } catch (error: any) {
      throw new Error(error.message || 'Password recovery completion failed');
    }
  }

  // Send email verification
  async sendEmailVerification(url: string): Promise<Models.Token> {
    try {
      return await account.createVerification(url);
    } catch (error: any) {
      throw new Error(error.message || 'Email verification sending failed');
    }
  }

  // Complete email verification
  async completeEmailVerification(userId: string, secret: string): Promise<Models.Token> {
    try {
      return await account.updateVerification(userId, secret);
    } catch (error: any) {
      throw new Error(error.message || 'Email verification failed');
    }
  }

  // Update user name
  async updateName(name: string): Promise<Models.User<Models.Preferences>> {
    try {
      return await account.updateName(name);
    } catch (error: any) {
      throw new Error(error.message || 'Name update failed');
    }
  }

  // Update user email
  async updateEmail(email: string, password: string): Promise<Models.User<Models.Preferences>> {
    try {
      return await account.updateEmail(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Email update failed');
    }
  }

  // Update user password
  async updatePassword(newPassword: string, oldPassword?: string): Promise<Models.User<Models.Preferences>> {
    try {
      return await account.updatePassword(newPassword, oldPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Password update failed');
    }
  }

  // Initialize default user settings when a new user registers
  private async initializeUserSettings(userId: string): Promise<void> {
    try {
      // Create default user settings
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_SETTINGS,
        ID.unique(),
        {
          userId,
          elementDelimiter: ',',
          rowEndDelimiter: ';',
          globalContext: 'Default work day is 9:00-17:00 unless specified. Breaks are unpaid and should not be tracked.'
        },
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );

      // Create default column definitions
      const defaultColumns = [
        {
          name: 'Start Time',
          description: 'When the time entry begins',
          format: 'YYYYMMDDTHHMM',
          sortOrder: 1
        },
        {
          name: 'End Time',
          description: 'When the time entry ends',
          format: 'YYYYMMDDTHHMM',
          sortOrder: 2
        },
        {
          name: 'Project Code',
          description: 'Project identifier or code',
          format: 'text',
          sortOrder: 3
        },
        {
          name: 'Description',
          description: 'Description of work performed',
          format: 'text',
          sortOrder: 4
        }
      ];

      const columnDocs = [];
      for (const column of defaultColumns) {
        const doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.COLUMN_DEFINITIONS,
          ID.unique(),
          {
            userId,
            ...column
          },
          [
            Permission.read(Role.user(userId)),
            Permission.write(Role.user(userId)),
            Permission.delete(Role.user(userId))
          ]
        );
        columnDocs.push(doc);
      }

      // Create default column values for Project Code
      const projectCodeColumn = columnDocs.find(col => col.name === 'Project Code');
      if (projectCodeColumn) {
        const defaultValues = [
          { value: 'ADMIN', description: 'Administrative tasks' },
          { value: 'MEET', description: 'Meetings and calls' },
          { value: 'DEV', description: 'Development work' },
          { value: 'UNKNOWN', description: 'Unspecified project' }
        ];

        for (const valueData of defaultValues) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.COLUMN_VALUES,
            ID.unique(),
            {
              userId,
              columnDefinitionId: projectCodeColumn.$id,
              ...valueData
            },
            [
              Permission.read(Role.user(userId)),
              Permission.write(Role.user(userId)),
              Permission.delete(Role.user(userId))
            ]
          );
        }
      }

      // Create default slash commands
      const defaultCommands = [
        {
          command: '/break',
          expansion: 'Break from 12:00 to 12:30',
          description: 'Standard lunch break'
        },
        {
          command: '/lunch',
          expansion: 'Lunch break from 12:00 to 13:00',
          description: 'Extended lunch break'
        },
        {
          command: '/meeting',
          expansion: 'Team meeting',
          description: 'Generic team meeting'
        }
      ];

      for (const command of defaultCommands) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.SLASH_COMMANDS,
          ID.unique(),
          {
            userId,
            ...command
          },
          [
            Permission.read(Role.user(userId)),
            Permission.write(Role.user(userId)),
            Permission.delete(Role.user(userId))
          ]
        );
      }
    } catch (error) {
      console.error('Failed to initialize user settings:', error);
      // Don't throw error here to avoid breaking registration flow
    }
  }
}

// Export singleton instance
export const authService = new AuthService();