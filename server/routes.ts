import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertShareSchema, insertChatMessageSchema, insertPrivateChatSessionSchema, insertPrivateChatMessageSchema } from "@shared/schema";
import multer from "multer";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { z } from "zod";

// Extend Express Request type to include file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// File upload configuration - Extended to 5GB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
  },
});

// Rate limiting
const createShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: "Too many shares created, try again later" }
});

// Generate random code
function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

// Calculate expiration date
function getExpirationDate(duration: string): Date {
  const now = new Date();
  switch (duration) {
    case '1m':
      return new Date(now.getTime() + 1 * 60 * 1000);
    case '10m':
      return new Date(now.getTime() + 10 * 60 * 1000);
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '1d':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 10 * 60 * 1000);
  }
}

// Fetch URL metadata
async function fetchUrlMetadata(url: string) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; QuickShare/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract basic metadata using regex
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) ||
                           html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    
    return {
      title: titleMatch ? titleMatch[1].trim() : new URL(url).hostname,
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      image: imageMatch ? imageMatch[1].trim() : '',
      domain: new URL(url).hostname
    };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return {
      title: new URL(url).hostname,
      description: '',
      image: '',
      domain: new URL(url).hostname
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create share endpoint
  app.post("/api/shares", createShareLimiter, upload.single('file'), async (req: MulterRequest, res) => {
    try {
      const { type, content, password, expiresIn, oneTimeView } = req.body;
      
      let shareData: any = {
        code: generateCode(),
        type,
        content: content || '',
        expiresAt: getExpirationDate(expiresIn || '10m'),
        oneTimeView: oneTimeView === 'true',
      };

      // Handle file upload
      if (type === 'file' && req.file) {
        shareData.content = req.file.buffer.toString('base64');
        shareData.fileName = req.file.originalname;
        shareData.fileSize = req.file.size;
      }

      // Handle password protection
      if (password && password.trim()) {
        shareData.password = await bcrypt.hash(password.trim(), 10);
      }

      // Validate with schema
      const validatedData = insertShareSchema.parse(shareData);
      const share = await storage.createShare(validatedData);

      // Fetch URL metadata if it's a URL share
      let metadata = null;
      if (type === 'url' && content) {
        try {
          new URL(content); // Validate URL
          metadata = await fetchUrlMetadata(content);
        } catch (error) {
          // Invalid URL, continue without metadata
        }
      }

      res.json({ 
        success: true, 
        share: {
          code: share.code,
          type: share.type,
          expiresAt: share.expiresAt,
          oneTimeView: share.oneTimeView,
          hasPassword: !!share.password
        },
        metadata 
      });
    } catch (error) {
      console.error('Error creating share:', error);
      res.status(400).json({ error: "Failed to create share" });
    }
  });

  // Get share endpoint
  app.get("/api/shares/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { password } = req.body;

      const share = await storage.getShareByCode(code.toUpperCase());
      if (!share) {
        return res.status(404).json({ error: "Share not found or expired" });
      }

      // Check password if required
      if (share.password) {
        if (!password) {
          return res.json({ requiresPassword: true });
        }
        
        const isValidPassword = await bcrypt.compare(password, share.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid password" });
        }
      }

      // Increment view count and handle one-time view
      const updatedShare = await storage.updateShare(code.toUpperCase(), {
        viewCount: (share.viewCount || 0) + 1
      });

      if (share.oneTimeView) {
        await storage.deleteShare(code.toUpperCase());
      }

      // Prepare response data
      let responseData: any = {
        type: share.type,
        content: share.content,
        fileName: share.fileName,
        fileSize: share.fileSize,
        expiresAt: share.expiresAt,
        viewCount: updatedShare?.viewCount || (share.viewCount || 0) + 1
      };

      // Decode file content for file shares
      if (share.type === 'file') {
        responseData.fileData = share.content; // base64 encoded
      }

      // Fetch URL metadata for URL shares
      if (share.type === 'url') {
        try {
          responseData.metadata = await fetchUrlMetadata(share.content);
        } catch (error) {
          // Continue without metadata
        }
      }

      res.json(responseData);
    } catch (error) {
      console.error('Error retrieving share:', error);
      res.status(500).json({ error: "Failed to retrieve share" });
    }
  });

  // Unlock password-protected share
  app.post("/api/shares/:code/unlock", async (req, res) => {
    try {
      const { code } = req.params;
      const { password } = req.body;

      const share = await storage.getShareByCode(code.toUpperCase());
      if (!share) {
        return res.status(404).json({ error: "Share not found or expired" });
      }

      if (!share.password) {
        return res.status(400).json({ error: "Share is not password protected" });
      }

      const isValidPassword = await bcrypt.compare(password, share.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error unlocking share:', error);
      res.status(500).json({ error: "Failed to unlock share" });
    }
  });

  // Get chat messages for a share
  app.get("/api/shares/:code/messages", async (req, res) => {
    try {
      const { code } = req.params;
      const messages = await storage.getChatMessages(code.toUpperCase());
      res.json(messages);
    } catch (error) {
      console.error('Error retrieving messages:', error);
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });

  // Private chat endpoints
  app.post("/api/private-chat", async (req, res) => {
    try {
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      
      const session = await storage.createPrivateChatSession({
        code,
        expiresAt,
        activeUsers: 0
      });

      res.json({ 
        success: true, 
        session: {
          code: session.code,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      console.error('Error creating private chat:', error);
      res.status(500).json({ error: "Failed to create private chat" });
    }
  });

  app.get("/api/private-chat/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const session = await storage.getPrivateChatSession(code.toUpperCase());
      
      if (!session) {
        return res.status(404).json({ error: "Chat room not found or expired" });
      }

      res.json({
        code: session.code,
        expiresAt: session.expiresAt,
        activeUsers: session.activeUsers
      });
    } catch (error) {
      console.error('Error retrieving private chat:', error);
      res.status(500).json({ error: "Failed to retrieve chat room" });
    }
  });

  app.get("/api/private-chat/:code/messages", async (req, res) => {
    try {
      const { code } = req.params;
      const messages = await storage.getPrivateChatMessages(code.toUpperCase());
      res.json(messages);
    } catch (error) {
      console.error('Error retrieving private chat messages:', error);
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  interface ClientConnection {
    ws: WebSocket;
    shareCode: string;
    userId: string;
  }

  const clients = new Map<WebSocket, ClientConnection>();
  const shareRooms = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws, request) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          const { shareCode, userId } = message;
          
          // Verify share exists
          const share = await storage.getShareByCode(shareCode.toUpperCase());
          if (!share) {
            ws.send(JSON.stringify({ type: 'error', message: 'Share not found' }));
            return;
          }

          // Add client to room
          clients.set(ws, { ws, shareCode: shareCode.toUpperCase(), userId });
          
          if (!shareRooms.has(shareCode.toUpperCase())) {
            shareRooms.set(shareCode.toUpperCase(), new Set());
          }
          shareRooms.get(shareCode.toUpperCase())!.add(ws);

          // Create or update chat session
          let session = await storage.getChatSession(shareCode.toUpperCase());
          if (!session) {
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            session = await storage.createChatSession({
              shareCode: shareCode.toUpperCase(),
              activeUsers: 1,
              expiresAt
            });
          } else {
            session = await storage.updateChatSession(shareCode.toUpperCase(), {
              activeUsers: shareRooms.get(shareCode.toUpperCase())!.size
            });
          }

          // Notify all clients in room about user count
          const roomClients = shareRooms.get(shareCode.toUpperCase());
          if (roomClients) {
            const userCount = roomClients.size;
            roomClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'userCount',
                  count: userCount,
                  expiresAt: session!.expiresAt
                }));
              }
            });
          }

          // Send chat history
          const messages = await storage.getChatMessages(shareCode.toUpperCase());
          ws.send(JSON.stringify({
            type: 'chatHistory',
            messages: messages.map(msg => ({
              id: msg.id,
              message: msg.message,
              userId: msg.userId,
              createdAt: msg.createdAt
            }))
          }));
        }

        if (message.type === 'joinPrivateChat') {
          const { chatCode, userId } = message;
          
          // Verify private chat session exists
          const session = await storage.getPrivateChatSession(chatCode.toUpperCase());
          if (!session) {
            ws.send(JSON.stringify({ type: 'error', message: 'Private chat room not found or expired' }));
            return;
          }

          // Add client to private chat room
          clients.set(ws, { ws, shareCode: chatCode.toUpperCase(), userId });
          
          if (!shareRooms.has(chatCode.toUpperCase())) {
            shareRooms.set(chatCode.toUpperCase(), new Set());
          }
          shareRooms.get(chatCode.toUpperCase())!.add(ws);

          // Update session active users
          await storage.updatePrivateChatSession(chatCode.toUpperCase(), {
            activeUsers: shareRooms.get(chatCode.toUpperCase())!.size
          });

          // Notify all clients in room about user count
          const roomClients = shareRooms.get(chatCode.toUpperCase());
          if (roomClients) {
            const userCount = roomClients.size;
            roomClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'userCount',
                  count: userCount,
                  expiresAt: session.expiresAt
                }));
              }
            });
          }

          // Send private chat history
          const messages = await storage.getPrivateChatMessages(chatCode.toUpperCase());
          ws.send(JSON.stringify({
            type: 'chatHistory',
            messages: messages.map(msg => ({
              id: msg.id,
              message: msg.message,
              userId: msg.userId,
              createdAt: msg.createdAt
            }))
          }));
        }

        if (message.type === 'message') {
          const client = clients.get(ws);
          if (!client) return;

          // Save message
          const chatMessage = await storage.createChatMessage({
            shareCode: client.shareCode,
            message: message.content,
            userId: client.userId
          });

          // Broadcast to all clients in room
          const roomClients = shareRooms.get(client.shareCode);
          if (roomClients) {
            const broadcastMessage = JSON.stringify({
              type: 'newMessage',
              message: {
                id: chatMessage.id,
                message: chatMessage.message,
                userId: chatMessage.userId,
                createdAt: chatMessage.createdAt
              }
            });

            roomClients.forEach(roomClient => {
              if (roomClient.readyState === WebSocket.OPEN) {
                roomClient.send(broadcastMessage);
              }
            });
          }
        }

        if (message.type === 'privateMessage') {
          const client = clients.get(ws);
          if (!client) return;

          // Save private chat message
          const chatMessage = await storage.createPrivateChatMessage({
            chatCode: client.shareCode,
            message: message.content,
            userId: client.userId
          });

          // Broadcast to all clients in private chat room
          const roomClients = shareRooms.get(client.shareCode);
          if (roomClients) {
            const broadcastMessage = JSON.stringify({
              type: 'newMessage',
              message: {
                id: chatMessage.id,
                message: chatMessage.message,
                userId: chatMessage.userId,
                createdAt: chatMessage.createdAt
              }
            });

            roomClients.forEach(roomClient => {
              if (roomClient.readyState === WebSocket.OPEN) {
                roomClient.send(broadcastMessage);
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', async () => {
      const client = clients.get(ws);
      if (client) {
        // Remove from room
        const roomClients = shareRooms.get(client.shareCode);
        if (roomClients) {
          roomClients.delete(ws);
          
          // Update active user count
          if (roomClients.size === 0) {
            shareRooms.delete(client.shareCode);
            await storage.deleteChatSession(client.shareCode);
          } else {
            await storage.updateChatSession(client.shareCode, {
              activeUsers: roomClients.size
            });

            // Notify remaining clients
            roomClients.forEach(roomClient => {
              if (roomClient.readyState === WebSocket.OPEN) {
                roomClient.send(JSON.stringify({
                  type: 'userCount',
                  count: roomClients.size
                }));
              }
            });
          }
        }
        
        clients.delete(ws);
      }
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
