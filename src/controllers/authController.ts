import { Request, Response } from "express";
import { CreateUserDto, LoginDto } from "../types";
import { AuthRequest, generateToken } from "../middleware/auth";
import { userRepository } from "../repository/userRepository";
import bcrypt from "bcryptjs";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const userData: CreateUserDto = req.body;

      if (!userData.email || !userData.password || !userData.name) {
        return res
          .status(400)
          .json({ error: "Email, password, and name are required" });
      }

      if (userData.password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
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
      if (error.message?.includes("already exists")) {
        return res.status(409).json({ error: error.message });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const loginData: LoginDto = req.body;

      if (!loginData.email || !loginData.password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const user = await userRepository.verifyPassword(
        loginData.email,
        loginData.password
      );

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
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
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const authuser = req.user;
      if (!authuser) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await userRepository.findById(authuser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;
      if (!authUser) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = (await userRepository.findById(authUser.id)) as any;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, email, oldPassword, newPassword, confirmPassword } =
        req.body;

      let userData: any = {
        id: user.id,
        name: name.trim() ?? user.name,
        email: email.trim() ?? user.email,
      };

      if (oldPassword || newPassword || confirmPassword) {
        if (!oldPassword || !newPassword || !confirmPassword) {
          return res
            .status(400)
            .json({ error: "All password fields are required." });
        }

        const isOldPasswordValid = await bcrypt.compare(
          oldPassword,
          user.password
        );


        if (!isOldPasswordValid) {
          return res.status(400).json({ error: "Old password is incorrect." });
        }

        if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: "New passwords do not match." });
        }

        if (newPassword.length < 8) {
          return res
            .status(400)
            .json({ error: "Password must be at least 8 characters." });
        }

        userData.password = newPassword;
      }

      await userRepository.update(userData);

      return res.status(200).json({
        message: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
