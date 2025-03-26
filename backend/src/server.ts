import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { database } from './infrastructure/database';
import { errorHandler } from './interfaces/api/middlewares';

// Import repositories
import { AuthRepository } from './infrastructure/repositories/auth_repository';
import { MongoUserRepository } from './infrastructure/repositories/user_repository';
import { MongoFrameworkRepository } from './infrastructure/repositories/framework_repository';
import { MongoControlRepository } from './infrastructure/repositories/control_repository';
import { MongoEvidenceRepository } from './infrastructure/repositories/evidence_repository';
import { MongoPolicyRepository } from './infrastructure/repositories/policy_repository';
import { MongoRiskRepository } from './infrastructure/repositories/risk_repository';
import { MongoRiskTreatmentRepository } from './infrastructure/repositories/risk_treatment_repository';
import { MongoReportRepository } from './infrastructure/repositories/report_repository'
import { MongoDashboardRepository } from './infrastructure/repositories/dashboard_repository'
import { MongoMetricRepository } from './infrastructure/repositories/metric_repository'

// Import domain services
import { AuthService } from './domain/auth/services'
import { ComplianceService } from './domain/compliance/framework_services'
import { EvidenceService } from './domain/compliance/evidence_service'
import { PolicyService } from './domain/compliance/policy_service'
import { RiskManagementService } from './domain/risk/service'
import { ReportingService } from './domain/reporting/reporting_service'

// Import auth use cases
import { RegisterUserUseCase } from './application/auth/register_user'
import { LoginUserUseCase } from './application/auth/login_user'
import { ValidateTokenUseCase } from './application/auth/validate_token'

// Import compliance use cases
import { CreateFrameworkUseCase } from './application/compliance/create_framework'
import { GetFrameworkUseCase } from './application/compliance/get_framework'
import { ListFrameworksUseCase } from './application/compliance/list_frameworks'
import { CreateControlUseCase } from './application/compliance/create_control'
import { GetControlUseCase } from './application/compliance/get_control'
import { ListControlsUseCase } from './application/compliance/list_controls'
import { UpdateControlImplementationUseCase } from './application/compliance/update_control_implementation'

// Import evidence use cases
import { CreateEvidenceUseCase } from './application/compliance/create_evidence'
import { GetEvidenceUseCase } from './application/compliance/get_evidence'
import { ListEvidenceUseCase } from './application/compliance/list_evidence'
import { ReviewEvidenceUseCase } from './application/compliance/review_evidence'
import { LinkEvidenceToControlUseCase } from './application/compliance/link_evidence_to_control'

// Import policy use cases
import { CreatePolicyUseCase } from './application/compliance/create_policy'
import { GetPolicyUseCase } from './application/compliance/get_policy'
import { ListPoliciesUseCase } from './application/compliance/list_policies'
import { ApprovePolicyUseCase } from './application/compliance/approve_policy'
import { PublishPolicyUseCase } from './application/compliance/publish_policy'

// Import risk use cases
import { CreateRiskUseCase } from './application/risk/create_risk'
import { GetRiskUseCase } from './application/risk/get_risk'
import { ListRisksUseCase } from './application/risk/list_risks'
import { CreateRiskTreatmentUseCase } from './application/risk/create_treatment'

// Import Reporting use cases
import { CreateReportUseCase } from './application/reporting/create_report'
import { GetReportUseCase } from './application/reporting/get_report'
import { ListReportsUseCase } from './application/reporting/list_reports'
import { GenerateReportUseCase } from './application/reporting/generate_report'
import { CreateDashboardUseCase } from './application/reporting/create_dashboard'
import { GetDashboardUseCase } from './application/reporting/get_dashboard'
import { ListDashboardsUseCase } from './application/reporting/list_dashboards'
import { CreateMetricUseCase } from './application/reporting/create_metric'
import { GetMetricUseCase } from './application/reporting/get_metric'
import { ListMetricsUseCase } from './application/reporting/list_metrics'
import { CalculateMetricUseCase } from './application/reporting/calculate_metric'

// Import controllers and routes
import { AuthController } from './interfaces/api/auth_controller'
import { createAuthRouter } from './interfaces/api/auth_routes'
import { FrameworkController } from './interfaces/api/framework_controller'
import { ControlController } from './interfaces/api/control_controller'
import { EvidenceController } from './interfaces/api/evidence_controller'
import { PolicyController } from './interfaces/api/policy_controller'
import { RiskController } from './interfaces/api/risk_controller'
import { createComplianceRouter } from './interfaces/api/compliance_routes'
import { createRiskRouter } from './interfaces/api/risk_routes'
import { ReportingController } from './interfaces/api/reporting_controller'
import { createReportingRouter } from './interfaces/api/reporting_routes'

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const port = process.env.PORT || 4000

// Configure middlewares
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/evidence')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Initialize repositories
const userRepository = new MongoUserRepository()
const authRepository = new AuthRepository(process.env.JWT_SECRET || 'your_jwt_secret_here')
const frameworkRepository = new MongoFrameworkRepository()
const controlRepository = new MongoControlRepository()
const evidenceRepository = new MongoEvidenceRepository()
const policyRepository = new MongoPolicyRepository()
const riskRepository = new MongoRiskRepository()
const riskTreatmentRepository = new MongoRiskTreatmentRepository()

// Initialize domain services
const authService = new AuthService(userRepository, authRepository)
const complianceService = new ComplianceService(frameworkRepository, controlRepository)
const evidenceService = new EvidenceService(evidenceRepository, controlRepository)
const policyService = new PolicyService(policyRepository, controlRepository)
const riskManagementService = new RiskManagementService(riskRepository, riskTreatmentRepository)

// Initialize auth use cases
const registerUserUseCase = new RegisterUserUseCase(authService)
const loginUserUseCase = new LoginUserUseCase(authService)
const validateTokenUseCase = new ValidateTokenUseCase(authService)

// Initialize compliance use cases
const createFrameworkUseCase = new CreateFrameworkUseCase(complianceService)
const getFrameworkUseCase = new GetFrameworkUseCase(frameworkRepository, controlRepository)
const listFrameworksUseCase = new ListFrameworksUseCase(frameworkRepository, controlRepository)
const createControlUseCase = new CreateControlUseCase(complianceService)
const getControlUseCase = new GetControlUseCase(controlRepository)
const listControlsUseCase = new ListControlsUseCase(controlRepository)
const updateControlImplementationUseCase = new UpdateControlImplementationUseCase(complianceService)

// Initialize evidence use cases
const createEvidenceUseCase = new CreateEvidenceUseCase(
  evidenceService,
  controlRepository,
  frameworkRepository
)
const getEvidenceUseCase = new GetEvidenceUseCase(
  evidenceRepository,
  controlRepository,
  frameworkRepository
)
const listEvidenceUseCase = new ListEvidenceUseCase(evidenceRepository)
const reviewEvidenceUseCase = new ReviewEvidenceUseCase(
  evidenceService,
  controlRepository,
  frameworkRepository
)
const linkEvidenceToControlUseCase = new LinkEvidenceToControlUseCase(
  evidenceService,
  controlRepository,
  frameworkRepository
)

// Initialize policy use cases
const createPolicyUseCase = new CreatePolicyUseCase(policyService)
const getPolicyUseCase = new GetPolicyUseCase(
  policyRepository,
  controlRepository,
  frameworkRepository
)
const listPoliciesUseCase = new ListPoliciesUseCase(policyRepository)
const approvePolicyUseCase = new ApprovePolicyUseCase(policyService)
const publishPolicyUseCase = new PublishPolicyUseCase(policyService)

// Initialize risk use cases
const createRiskUseCase = new CreateRiskUseCase(riskManagementService)
const getRiskUseCase = new GetRiskUseCase(
  riskRepository,
  riskTreatmentRepository,
  controlRepository,
  frameworkRepository
)
const listRisksUseCase = new ListRisksUseCase(riskRepository, riskTreatmentRepository)
const createRiskTreatmentUseCase = new CreateRiskTreatmentUseCase(riskManagementService)

// Initialize repositories
const reportRepository = new MongoReportRepository()
const dashboardRepository = new MongoDashboardRepository()
const metricRepository = new MongoMetricRepository()

// Initialize domain services
const reportingService = new ReportingService(
  reportRepository,
  dashboardRepository,
  metricRepository
)

// Initialize reporting use cases
const createReportUseCase = new CreateReportUseCase(reportingService)
const getReportUseCase = new GetReportUseCase(reportRepository)
const listReportsUseCase = new ListReportsUseCase(reportRepository)
const generateReportUseCase = new GenerateReportUseCase(reportingService)
const createDashboardUseCase = new CreateDashboardUseCase(reportingService)
const getDashboardUseCase = new GetDashboardUseCase(dashboardRepository)
const listDashboardsUseCase = new ListDashboardsUseCase(dashboardRepository)
const createMetricUseCase = new CreateMetricUseCase(reportingService)
const getMetricUseCase = new GetMetricUseCase(metricRepository)
const listMetricsUseCase = new ListMetricsUseCase(metricRepository)
const calculateMetricUseCase = new CalculateMetricUseCase(reportingService)

// Initialize controllers
const reportingController = new ReportingController(
  createReportUseCase,
  getReportUseCase,
  listReportsUseCase,
  generateReportUseCase,
  createDashboardUseCase,
  getDashboardUseCase,
  listDashboardsUseCase,
  createMetricUseCase,
  getMetricUseCase,
  listMetricsUseCase,
  calculateMetricUseCase
)

// Initialize controllers
const authController = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
  validateTokenUseCase
)

const frameworkController = new FrameworkController(
  createFrameworkUseCase,
  getFrameworkUseCase,
  listFrameworksUseCase
)

const controlController = new ControlController(
  createControlUseCase,
  getControlUseCase,
  listControlsUseCase,
  updateControlImplementationUseCase
)

const evidenceController = new EvidenceController(
  createEvidenceUseCase,
  getEvidenceUseCase,
  listEvidenceUseCase,
  reviewEvidenceUseCase,
  linkEvidenceToControlUseCase
)

const policyController = new PolicyController(
  createPolicyUseCase,
  getPolicyUseCase,
  listPoliciesUseCase,
  approvePolicyUseCase,
  publishPolicyUseCase
)

const riskController = new RiskController(
  createRiskUseCase,
  getRiskUseCase,
  listRisksUseCase,
  createRiskTreatmentUseCase
)

// Configure routes
app.use('/api/auth', createAuthRouter(authController, authRepository, userRepository))
app.use(
  '/api/compliance',
  createComplianceRouter(
    frameworkController,
    controlController,
    evidenceController,
    policyController,
    authRepository,
    userRepository
  )
)
app.use('/api/risk', createRiskRouter(riskController, authRepository, userRepository))
app.use(
  '/api/reporting',
  createReportingRouter(reportingController, authRepository, userRepository)
)

// Serve uploaded files (only in development - in production use a proper storage solution)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start the server
const startServer = async () => {
  try {
    // Connect to database
    const dbResult = await database.connect();

    if (!dbResult.isSuccess) {
      console.error('Failed to connect to database:', dbResult.getError().message);
      process.exit(1);
    }

    // Start HTTP server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Gracefully shutting down');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Gracefully shutting down');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();
