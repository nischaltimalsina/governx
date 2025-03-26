import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../application/auth/register_user';
import { LoginUserUseCase } from '../../application/auth/login_user';
import { ValidateTokenUseCase } from '../../application/auth/validate_token';

/**
 * Controller for authentication endpoints
 */
export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private validateTokenUseCase: ValidateTokenUseCase
  ) {}

  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, roles } = req.body;

      const result = await this.registerUserUseCase.execute({
        email,
        password,
        firstName,
        lastName,
        roles,
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      console.error('Register user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Login user
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await this.loginUserUseCase.execute({
        email,
        password,
      });

      if (!result.isSuccess) {
        res.status(401).json({
          success: false,
          message: result.getError().message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      console.error('Login user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Validate token and get current user
   */
  public me = async (req: Request, res: Response): Promise<void> => {
    try {
      // The token should be verified by the authenticate middleware
      if (!req.token) {
        res.status(401).json({
          success: false,
          message: 'No authentication token provided',
        });
        return;
      }

      const result = await this.validateTokenUseCase.execute({
        token: req.token,
      });

      if (!result.isSuccess) {
        res.status(401).json({
          success: false,
          message: result.getError().message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      console.error('Validate token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}
