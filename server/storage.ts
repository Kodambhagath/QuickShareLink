import { type Share, type InsertShare, type ChatMessage, type InsertChatMessage, type ChatSession, type InsertChatSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Share operations
  createShare(share: InsertShare): Promise<Share>;
  getShareByCode(code: string): Promise<Share | undefined>;
  updateShare(code: string, updates: Partial<Share>): Promise<Share | undefined>;
  deleteShare(code: string): Promise<boolean>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(shareCode: string): Promise<ChatSession | undefined>;
  updateChatSession(shareCode: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(shareCode: string): Promise<boolean>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(shareCode: string): Promise<ChatMessage[]>;
  
  // Cleanup expired items
  cleanupExpired(): Promise<void>;
}

export class MemStorage implements IStorage {
  private shares: Map<string, Share>;
  private chatSessions: Map<string, ChatSession>;
  private chatMessages: Map<string, ChatMessage[]>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.shares = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    
    // Clean up expired items every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  async createShare(insertShare: InsertShare): Promise<Share> {
    const id = randomUUID();
    const share: Share = {
      ...insertShare,
      id,
      viewCount: 0,
      createdAt: new Date(),
    };
    this.shares.set(share.code, share);
    return share;
  }

  async getShareByCode(code: string): Promise<Share | undefined> {
    const share = this.shares.get(code);
    if (!share) return undefined;
    
    // Check if expired
    if (share.expiresAt < new Date()) {
      this.shares.delete(code);
      return undefined;
    }
    
    return share;
  }

  async updateShare(code: string, updates: Partial<Share>): Promise<Share | undefined> {
    const share = this.shares.get(code);
    if (!share) return undefined;
    
    const updatedShare = { ...share, ...updates };
    this.shares.set(code, updatedShare);
    return updatedShare;
  }

  async deleteShare(code: string): Promise<boolean> {
    return this.shares.delete(code);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.chatSessions.set(session.shareCode, session);
    return session;
  }

  async getChatSession(shareCode: string): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(shareCode);
    if (!session) return undefined;
    
    // Check if expired
    if (session.expiresAt < new Date()) {
      this.chatSessions.delete(shareCode);
      this.chatMessages.delete(shareCode);
      return undefined;
    }
    
    return session;
  }

  async updateChatSession(shareCode: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(shareCode);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.chatSessions.set(shareCode, updatedSession);
    return updatedSession;
  }

  async deleteChatSession(shareCode: string): Promise<boolean> {
    this.chatMessages.delete(shareCode);
    return this.chatSessions.delete(shareCode);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    
    const messages = this.chatMessages.get(insertMessage.shareCode) || [];
    messages.push(message);
    this.chatMessages.set(insertMessage.shareCode, messages);
    
    return message;
  }

  async getChatMessages(shareCode: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(shareCode) || [];
  }

  async cleanupExpired(): Promise<void> {
    const now = new Date();
    
    // Cleanup expired shares
    for (const [code, share] of this.shares.entries()) {
      if (share.expiresAt < now) {
        this.shares.delete(code);
      }
    }
    
    // Cleanup expired chat sessions
    for (const [shareCode, session] of this.chatSessions.entries()) {
      if (session.expiresAt < now) {
        this.chatSessions.delete(shareCode);
        this.chatMessages.delete(shareCode);
      }
    }
  }
}

export const storage = new MemStorage();
