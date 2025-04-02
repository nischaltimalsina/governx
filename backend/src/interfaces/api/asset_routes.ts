import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { AssetController } from './asset_controller'
import { validateRequest } from './middlewares'
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware'
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories'
import { UserRole } from '../../domain/auth/entities'
import { AssetType, AssetStatus, AssetRiskLevel } from '../../domain/asset/asset_values'

export const createAssetRouter = (
  assetController: AssetController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router()
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository)

  // Asset routes
  // POST /api/asset
  router.post(
    '/',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.IT_MANAGER]),
      body('name').isString().notEmpty().withMessage('Asset name is required'),
      body('type').isIn(Object.values(AssetType)).withMessage('Invalid asset type'),
      body('description').isString().notEmpty().withMessage('Asset description is required'),
      body('status')
        .optional()
        .isIn(Object.values(AssetStatus))
        .withMessage('Invalid asset status'),
      body('riskLevel')
        .optional()
        .isIn(Object.values(AssetRiskLevel))
        .withMessage('Invalid risk level'),
      body('purchaseDate')
        .optional()
        .isISO8601()
        .withMessage('Valid ISO date required for purchase date'),
      body('endOfLifeDate')
        .optional()
        .isISO8601()
        .withMessage('Valid ISO date required for end of life date'),
      validateRequest,
    ],
    assetController.createAsset
  )

  // GET /api/asset/:id
  router.get(
    '/:id',
    [authenticate, param('id').isString().withMessage('Asset ID is required'), validateRequest],
    assetController.getAsset
  )

  // GET /api/asset
  router.get(
    '/',
    [
      authenticate,
      query('type').optional().isIn(Object.values(AssetType)).withMessage('Invalid asset type'),
      query('status')
        .optional()
        .isIn(Object.values(AssetStatus))
        .withMessage('Invalid asset status'),
      query('riskLevel')
        .optional()
        .isIn(Object.values(AssetRiskLevel))
        .withMessage('Invalid risk level'),
      query('ownerId').optional().isString(),
      query('controlId').optional().isString(),
      query('nearingEndOfLife')
        .optional()
        .isBoolean()
        .withMessage('nearingEndOfLife must be a boolean'),
      query('active').optional().isBoolean().withMessage('active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('pageSize must be an integer'),
      query('pageNumber').optional().isInt().withMessage('pageNumber must be an integer'),
      query('search').optional().isString(),
      validateRequest,
    ],
    assetController.listAssets
  )

  // PATCH /api/asset/:id/owner
  router.patch(
    '/:id/owner',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.IT_MANAGER]),
      param('id').isString().withMessage('Asset ID is required'),
      body('ownerId').isString().notEmpty().withMessage('Owner ID is required'),
      body('ownerName').isString().notEmpty().withMessage('Owner name is required'),
      body('ownerDepartment').isString().notEmpty().withMessage('Owner department is required'),
      validateRequest,
    ],
    assetController.assignAssetOwner
  )

  // PATCH /api/asset/:id/status
  router.patch(
    '/:id/status',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.IT_MANAGER]),
      param('id').isString().withMessage('Asset ID is required'),
      body('status').isIn(Object.values(AssetStatus)).withMessage('Invalid asset status'),
      validateRequest,
    ],
    assetController.updateAssetStatus
  )

  // POST /api/asset/:id/controls
  router.post(
    '/:id/controls',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.COMPLIANCE_MANAGER]),
      param('id').isString().withMessage('Asset ID is required'),
      body('controlId').isString().notEmpty().withMessage('Control ID is required'),
      validateRequest,
    ],
    assetController.linkAssetToControl
  )

  // PATCH /api/asset/:id/technical-details
  router.patch(
    '/:id/technical-details',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.IT_MANAGER]),
      param('id').isString().withMessage('Asset ID is required'),
      validateRequest,
    ],
    assetController.updateAssetTechnicalDetails
  )

  // PATCH /api/asset/:id/risk-level
  router.patch(
    '/:id/risk-level',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.RISK_MANAGER]),
      param('id').isString().withMessage('Asset ID is required'),
      body('riskLevel').isIn(Object.values(AssetRiskLevel)).withMessage('Invalid risk level'),
      validateRequest,
    ],
    assetController.updateAssetRiskLevel
  )

  // GET /api/asset/statistics
  router.get(
    '/statistics',
    [authenticate, authorize([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.RISK_MANAGER])],
    assetController.getAssetStatistics
  )

  return router
}
