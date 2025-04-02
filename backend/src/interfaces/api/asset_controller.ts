import { Request, Response } from 'express'
import { CreateAssetUseCase } from '../../application/asset/create_asset'
import { GetAssetUseCase } from '../../application/asset/get_asset'
import { ListAssetsUseCase } from '../../application/asset/list_assets'
import { AssignAssetOwnerUseCase } from '../../application/asset/assign_asset_owner'
import { UpdateAssetStatusUseCase } from '../../application/asset/update_asset_status'
import { LinkAssetToControlUseCase } from '../../application/asset/link_asset_to_control'
import { UpdateAssetTechnicalDetailsUseCase } from '../../application/asset/update_asset_technical_details'
import { AssetType, AssetStatus, AssetRiskLevel } from '../../domain/asset/asset_values'
import { UpdateAssetRiskLevelUseCase } from '@/application/asset/update_asset_risk_level'
import { GetAssetStatisticsUseCase } from '@/application/asset/get_asset_statistics'

/**
 * Controller for asset-related endpoints
 */
export class AssetController {
  constructor(
    private createAssetUseCase: CreateAssetUseCase,
    private getAssetUseCase: GetAssetUseCase,
    private listAssetsUseCase: ListAssetsUseCase,
    private assignAssetOwnerUseCase: AssignAssetOwnerUseCase,
    private updateAssetStatusUseCase: UpdateAssetStatusUseCase,
    private linkAssetToControlUseCase: LinkAssetToControlUseCase,
    private updateAssetTechnicalDetailsUseCase: UpdateAssetTechnicalDetailsUseCase,
    private updateAssetRiskLevelUseCase: UpdateAssetRiskLevelUseCase,
    private getAssetStatisticsUseCase: GetAssetStatisticsUseCase
  ) {}

  /**
   * Create a new asset
   */
  public createAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      // Parse tags if provided as string
      let tags
      if (typeof req.body.tags === 'string') {
        tags = JSON.parse(req.body.tags)
      } else {
        tags = req.body.tags
      }

      // Parse controlIds if provided as string
      let controlIds
      if (typeof req.body.controlIds === 'string') {
        controlIds = JSON.parse(req.body.controlIds)
      } else {
        controlIds = req.body.controlIds
      }

      // Parse dates if provided
      const purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined
      const endOfLifeDate = req.body.endOfLifeDate ? new Date(req.body.endOfLifeDate) : undefined

      // Create DTO from request
      const createAssetDto = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        status: req.body.status,
        owner: req.body.owner,
        riskLevel: req.body.riskLevel,
        location: req.body.location,
        ipAddress: req.body.ipAddress,
        macAddress: req.body.macAddress,
        serialNumber: req.body.serialNumber,
        purchaseDate,
        endOfLifeDate,
        tags,
        metadata: req.body.metadata,
        controlIds,
        relatedAssetIds: req.body.relatedAssetIds,
      }

      const result = await this.createAssetUseCase.execute(createAssetDto, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(201).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Create asset error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get an asset by ID
   */
  public getAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const result = await this.getAssetUseCase.execute(id)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      const asset = result.getValue()

      if (!asset) {
        res.status(404).json({
          success: false,
          message: `Asset with ID ${id} not found`,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: asset,
      })
    } catch (error) {
      console.error('Get asset error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * List assets with filters
   */
  public listAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const ownerId = req.query.ownerId as string | undefined
      const controlId = req.query.controlId as string | undefined
      const search = req.query.search as string | undefined
      const nearingEndOfLife = req.query.nearingEndOfLife === 'true'
      const active =
        req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined

      // Parse type array
      let types: AssetType[] | undefined
      const typeParam = req.query.type
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          types = typeParam as AssetType[]
        } else {
          types = [typeParam as AssetType]
        }
      }

      // Parse status array
      let statuses: AssetStatus[] | undefined
      const statusParam = req.query.status
      if (statusParam) {
        if (Array.isArray(statusParam)) {
          statuses = statusParam as AssetStatus[]
        } else {
          statuses = [statusParam as AssetStatus]
        }
      }

      // Parse risk level array
      let riskLevels: AssetRiskLevel[] | undefined
      const riskLevelParam = req.query.riskLevel
      if (riskLevelParam) {
        if (Array.isArray(riskLevelParam)) {
          riskLevels = riskLevelParam as AssetRiskLevel[]
        } else {
          riskLevels = [riskLevelParam as AssetRiskLevel]
        }
      }

      // Parse tags array
      let tags: string[] | undefined
      const tagsParam = req.query.tags
      if (tagsParam) {
        if (Array.isArray(tagsParam)) {
          tags = tagsParam as string[]
        } else {
          tags = [tagsParam as string]
        }
      }

      const result = await this.listAssetsUseCase.execute({
        types,
        statuses,
        riskLevels,
        ownerId,
        controlId,
        tags,
        nearingEndOfLife,
        active,
        search,
        pageSize,
        pageNumber,
      })

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('List assets error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Assign an owner to an asset
   */
  public assignAssetOwner = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.assignAssetOwnerUseCase.execute(
        id,
        {
          ownerId: req.body.ownerId,
          ownerName: req.body.ownerName,
          ownerDepartment: req.body.ownerDepartment,
        },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Assign asset owner error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Update asset status
   */
  public updateAssetStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.updateAssetStatusUseCase.execute(
        id,
        { status: req.body.status },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Update asset status error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Link asset to control
   */
  public linkAssetToControl = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.linkAssetToControlUseCase.execute(
        id,
        { controlId: req.body.controlId },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Link asset to control error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Update asset technical details
   */
  public updateAssetTechnicalDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.updateAssetTechnicalDetailsUseCase.execute(
        id,
        {
          location: req.body.location,
          ipAddress: req.body.ipAddress,
          macAddress: req.body.macAddress,
          serialNumber: req.body.serialNumber,
        },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Update asset technical details error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }
  /**
   * Update asset risk level
   */
  public updateAssetRiskLevel = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.updateAssetRiskLevelUseCase.execute(
        id,
        { riskLevel: req.body.riskLevel },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Update asset risk level error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get asset statistics
   */
  public getAssetStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.getAssetStatisticsUseCase.execute()

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Get asset statistics error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }
}
