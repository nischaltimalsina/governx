import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EvidenceController } from './evidence_controller';
import { validateRequest } from './middlewares';
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware';
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories';
import { UserRole } from '../../domain/auth/entities';
import { EvidenceType, EvidenceStatus } from '../../domain/compliance/evidence_values';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/evidence');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    // In a real app, we would restrict file types based on security requirements
    cb(null, true);
  }
});

export const createEvidenceRouter = (
  evidenceController: EvidenceController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router();
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository);

  // Evidence routes
  // POST /api/compliance/evidence
  router.post(
    '/',
    [
      authenticate,
      upload.single('file'), // 'file' is the field name for the uploaded file
      body('title').isString().notEmpty().withMessage('Title is required'),
      body('controlIds').notEmpty().withMessage('At least one control ID is required'),
      body('type').isIn(Object.values(EvidenceType)).withMessage('Invalid evidence type'),
      body('description').optional().isString(),
      body('validityStartDate').optional().isISO8601().withMessage('Valid ISO date required for validity start date'),
      body('validityEndDate').optional().isISO8601().withMessage('Valid ISO date required for validity end date'),
      body('tags').optional(),
      body('metadata').optional(),
      validateRequest
    ],
    evidenceController.createEvidence
  );

  // GET /api/compliance/evidence/:id
  router.get(
    '/:id',
    [
      authenticate,
      param('id').isString().withMessage('Evidence ID is required'),
      query('includeControls').optional().isBoolean().withMessage('includeControls must be a boolean'),
      validateRequest
    ],
    evidenceController.getEvidence
  );

  // GET /api/compliance/evidence
  router.get(
    '/',
    [
      authenticate,
      query('controlId').optional().isString(),
      query('frameworkId').optional().isString(),
      query('status').optional().isIn(Object.values(EvidenceStatus)).withMessage('Invalid status'),
      query('type').optional().isIn(Object.values(EvidenceType)).withMessage('Invalid type'),
      query('createdBy').optional().isString(),
      query('reviewerId').optional().isString(),
      query('startDate').optional().isISO8601().withMessage('Valid ISO date required for start date'),
      query('endDate').optional().isISO8601().withMessage('Valid ISO date required for end date'),
      query('active').optional().isBoolean().withMessage('active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('pageSize must be an integer'),
      query('pageNumber').optional().isInt().withMessage('pageNumber must be an integer'),
      query('search').optional().isString(),
      validateRequest
    ],
    evidenceController.listEvidence
  );

  // PATCH /api/compliance/evidence/:id/review
  router.patch(
    '/:id/review',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.AUDITOR]),
      param('id').isString().withMessage('Evidence ID is required'),
      body('status').isIn([EvidenceStatus.APPROVED, EvidenceStatus.REJECTED]).withMessage('Status must be either approved or rejected'),
      body('notes').optional().isString(),
      validateRequest
    ],
    evidenceController.reviewEvidence
  );

  // POST /api/compliance/evidence/:id/controls
  router.post(
    '/:id/controls',
    [
      authenticate,
      param('id').isString().withMessage('Evidence ID is required'),
      body('controlId').isString().notEmpty().withMessage('Control ID is required'),
      validateRequest
    ],
    evidenceController.linkEvidenceToControl
  );

  return router;
};
