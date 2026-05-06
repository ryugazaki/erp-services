import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapAuthError } from './AuthErrorMapper';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@injectable()
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  login = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.loginUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapAuthError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { accessToken, refreshToken } = result.getValue();
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(ApiResponse.success({ accessToken }, 'Login successful'));
  };

  refresh = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json(
        ApiResponse.error('UNAUTHORIZED', 'Refresh token is missing', 401),
      );
    }

    const result = await this.refreshTokenUseCase.execute({ refreshToken });

    if (result.isFailure()) {
      res.clearCookie('refreshToken');
      const { status, message } = mapAuthError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { accessToken, refreshToken: newRefreshToken } = result.getValue();
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(ApiResponse.success({ accessToken }, 'Token refreshed successfully'));
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.refreshToken;
    const allDevices = req.body?.allDevices === true;

    if (refreshToken) {
      await this.logoutUseCase.execute({ refreshToken, allDevices });
    }

    res.clearCookie('refreshToken');

    return res.status(200).json(
      ApiResponse.success(null, allDevices ? 'Logged out from all devices' : 'Logged out successfully'),
    );
  };

  me = async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).json(
      ApiResponse.success((req as any).user, 'User retrieved successfully'),
    );
  };
}
