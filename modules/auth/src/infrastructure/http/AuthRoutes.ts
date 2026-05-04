import { Router } from 'express';
import { AuthController } from './AuthController';
import { createAuthMiddleware } from './middlewares/authenticate.middleware';
import { validate } from '@erp/core/http';
import { LoginSchema } from '../../application/dtos/LoginDTO';
import { RegisterSchema } from '../../application/dtos/RegisterDTO';
import { ITokenService } from '../../application/ports/ITokenService';

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication & authorization endpoints
 */

export function createAuthRoutes(
  controller: AuthController,
  tokenService: ITokenService,
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(tokenService);

  /**
   * @swagger
   * /login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         headers:
   *           Set-Cookie:
   *             description: refreshToken httpOnly cookie
   *             schema:
   *               type: string
   *               example: refreshToken=jwt; Path=/; HttpOnly; SameSite=Strict
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AuthTokens'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: User is inactive
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/login', validate(LoginSchema), controller.login);

  /**
   * @swagger
   * /register:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: Registration successful
   *         content:
   *           application/json:
   *             schema:
   *               $Of:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         id: { type: 'string', example: 'uuid' }
   *                         email: { type: 'string', example: 'user@example.com' }
   *                         role: { type: 'string', example: 'EMPLOYEE' }
   *       400:
   *         description: Validation error or duplicate email
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/register', validate(RegisterSchema), controller.register);

  /**
   * @swagger
   * /refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Refresh access token
   *     description: Exchanges a valid refresh token (from httpOnly cookie) for a new token pair. Detects token reuse and revokes the entire token family.
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         headers:
   *           Set-Cookie:
   *             description: New refreshToken httpOnly cookie
   *             schema:
   *               type: string
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AuthTokens'
   *       401:
   *         description: Missing or invalid refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/refresh', controller.refresh);

  /**
   * @swagger
   * /logout:
   *   post:
   *     tags: [Auth]
   *     summary: Logout
   *     description: Revokes the refresh token family. Optionally revoke all devices.
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LogoutRequest'
   *     responses:
   *       200:
   *         description: Logged out successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   */
  router.post('/logout', controller.logout);

  /**
   * @swagger
   * /me:
   *   get:
   *     tags: [Auth]
   *     summary: Get current user profile
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/UserProfile'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/me', authenticate, controller.me);

  return router;
}
