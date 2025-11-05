import { Request, Response } from 'express';
import { CreateUserDto, LoginDto } from '../types';
import { generateToken } from '../middleware/auth';
import { userRepository } from '../repository/userRepository';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const userData: CreateUserDto = req.body;

      if (!userData.email || !userData.password || !userData.name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      if (userData.password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const user = await userRepository.create(userData);
      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const loginData: LoginDto = req.body;

      if (!loginData.email || !loginData.password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await userRepository.verifyPassword(loginData.email, loginData.password);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async me(req: Request & { userId?: string }, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

