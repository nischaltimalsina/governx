import mongoose from 'mongoose'
import { Result } from '../common/result'
import { Dashboard, DashboardWidget } from './dashboard'
import { Metric, MetricCalculationMethod } from './metric'
import { Report } from './report'
import { IDashboardRepository, IMetricRepository, IReportRepository } from './reporting_repository'
import {
  DashboardName,
  DashboardType,
  MetricName,
  MetricType,
  ReportFilter,
  ReportFormat,
  ReportName,
  ReportSchedule,
  ReportType,
} from './reporting_values'

import fs from 'fs'
import path from 'path'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

import { ImplementationStatus } from '../compliance/framework_values'
import { RiskStatus, RiskSeverity } from '../risk/risk_values'
import { FindingStatus, FindingSeverity } from '../audit/audit_values'
import { PolicyStatus } from '../compliance/policy_values'
import { IControlRepository, IFrameworkRepository } from '../compliance/framework_repository'
import { IEvidenceRepository } from '../compliance/evidence_repository'
import { IPolicyRepository } from '../compliance/policy_repository'
import { IRiskRepository, IRiskTreatmentRepository } from '../risk/repositories'
import { IAuditRepository, IFindingRepository } from '../audit/repositories'

/**
 * Reporting service for managing reports, dashboards, and metrics
 */
export class ReportingService {
  constructor(
    private reportRepository: IReportRepository,
    private dashboardRepository: IDashboardRepository,
    private metricRepository: IMetricRepository,
    private frameworkRepository: IFrameworkRepository,
    private controlRepository: IControlRepository,
    private evidenceRepository: IEvidenceRepository,
    private policyRepository: IPolicyRepository,
    private riskRepository: IRiskRepository,
    private riskTreatmentRepository: IRiskTreatmentRepository,
    private auditRepository: IAuditRepository,
    private findingRepository: IFindingRepository
  ) {}

  /**
   * Create a new report
   */
  public async createReport(
    name: ReportName,
    type: ReportType,
    description: string,
    format: ReportFormat,
    userId: string,
    options?: {
      filter?: ReportFilter
      schedule?: ReportSchedule
      templateId?: string
    }
  ): Promise<Result<Report, Error>> {
    // Create report entity
    const reportId = new mongoose.Types.ObjectId().toString()
    const reportResult = Report.create(reportId, {
      name,
      type,
      description,
      format,
      filter: options?.filter,
      schedule: options?.schedule,
      templateId: options?.templateId,
      createdBy: userId,
    })

    if (!reportResult.isSuccess) {
      return Result.fail<Report>(reportResult.getError())
    }

    const report = reportResult.getValue()

    // Save report to repository
    const saveResult = await this.reportRepository.save(report)

    if (!saveResult.isSuccess) {
      return Result.fail<Report>(saveResult.getError())
    }

    return Result.ok<Report>(report)
  }

  /**
   * Format and save report based on the specified format
   */
  private async formatAndSaveReport(
    data: any,
    format: ReportFormat,
    filePath: string
  ): Promise<void> {
    switch (format) {
      case ReportFormat.JSON: {
        const jsonContent = JSON.stringify(data, null, 2)
        fs.writeFileSync(filePath, jsonContent, { encoding: 'utf8' })
        console.log('JSON report saved successfully.')
        break
      }
      case ReportFormat.CSV: {
        // Format as CSV
        // This is a simplified CSV generator for demonstration purposes
        // In a real implementation, you'd want to use a library like json2csv

        // Handle different report types with appropriate CSV structure
        let csvContent = ''

        if (data.frameworks) {
          // Compliance summary
          csvContent =
            'Framework ID,Name,Version,Total Controls,Implemented,Partially Implemented,Not Implemented,Not Applicable,Implementation Rate (%)\n'
          for (const framework of data.frameworks) {
            csvContent += `${framework.id},${framework.name},${framework.version},${framework.totalControls},${framework.implementedControls},${framework.partiallyImplementedControls},${framework.notImplementedControls},${framework.notApplicableControls},${framework.implementationRate}\n`
          }
        } else if (data.risks) {
          // Risk assessment
          csvContent =
            'Risk ID,Name,Category,Status,Inherent Impact,Inherent Likelihood,Inherent Score,Residual Score,Risk Reduction (%)\n'
          for (const risk of data.risks) {
            csvContent += `${risk.id},"${risk.name}",${risk.category},${risk.status},${
              risk.inherentRisk.impact
            },${risk.inherentRisk.likelihood},${risk.inherentRisk.score},${
              risk.residualRisk?.score || 'N/A'
            },${risk.riskReductionPercentage || 'N/A'}\n`
          }
        } else if (data.controls) {
          // Control effectiveness
          csvContent = 'Control ID,Code,Title,Framework,Implementation Status,Evidence Count\n'
          for (const control of data.controls) {
            csvContent += `${control.id},${control.code},"${control.title}",${
              control.framework?.name || 'N/A'
            },${control.implementationStatus},${control.evidenceCount}\n`
          }
        } else if (data.findings) {
          // Audit findings
          csvContent =
            'Finding ID,Audit ID,Title,Type,Severity,Status,Due Date,Is Overdue,Has Remediation\n'
          for (const finding of data.findings) {
            csvContent += `${finding.id},${finding.auditId},"${finding.title}",${finding.type},${
              finding.severity
            },${finding.status},${finding.dueDate || 'N/A'},${finding.isOverdue},${
              finding.hasRemediationPlan
            }\n`
          }
        } else if (data.policies) {
          // Policy management
          csvContent = 'Policy ID,Name,Version,Type,Status,Is Effective,Review Date,Control Count\n'
          for (const policy of data.policies) {
            csvContent += `${policy.id},"${policy.name}",${policy.version},${policy.type},${
              policy.status
            },${policy.isEffective},${policy.reviewDate || 'N/A'},${policy.controlCount}\n`
          }
        } else {
          // Custom report - basic structure
          csvContent = 'Report Name,Generated At\n'
          csvContent += `"${data.title}",${data.generatedAt}\n`
        }

        fs.writeFileSync(filePath, csvContent, 'utf8')
        break
      }

      case ReportFormat.EXCEL: {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Report')

        if (data.frameworks) {
          worksheet.columns = [
            { header: 'Framework ID', key: 'id', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Version', key: 'version', width: 10 },
            { header: 'Total Controls', key: 'totalControls', width: 15 },
            { header: 'Implemented', key: 'implementedControls', width: 15 },
            { header: 'Partially Implemented', key: 'partiallyImplementedControls', width: 20 },
            { header: 'Not Implemented', key: 'notImplementedControls', width: 15 },
            { header: 'Not Applicable', key: 'notApplicableControls', width: 15 },
            { header: 'Implementation Rate (%)', key: 'implementationRate', width: 20 },
          ]
          data.frameworks.forEach((framework: any) => worksheet.addRow(framework))
        }

        await workbook.xlsx.writeFile(filePath)
        console.log('Excel report saved successfully.')
        break
      }

      case ReportFormat.PDF: {
        const doc = new PDFDocument()
        const writeStream = fs.createWriteStream(filePath)
        doc.pipe(writeStream)

        doc.fontSize(20).text('Report', { align: 'center' })
        doc.moveDown()

        if (data.frameworks) {
          data.frameworks.forEach((framework: any, index: number) => {
            doc.fontSize(12).text(`Framework ${index + 1}:`, { underline: true })
            doc.text(`ID: ${framework.id}`)
            doc.text(`Name: ${framework.name}`)
            doc.text(`Version: ${framework.version}`)
            doc.text(`Total Controls: ${framework.totalControls}`)
            doc.text(`Implemented: ${framework.implementedControls}`)
            doc.text(`Partially Implemented: ${framework.partiallyImplementedControls}`)
            doc.text(`Not Implemented: ${framework.notImplementedControls}`)
            doc.text(`Not Applicable: ${framework.notApplicableControls}`)
            doc.text(`Implementation Rate: ${framework.implementationRate}%`)
            doc.moveDown()
          })
        }

        doc.end()
        await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()))
        console.log('PDF report saved successfully.')
        break
      }
      default: {
        // For this example, we'll just save as JSON with the appropriate extension
        const jsonContent = JSON.stringify(data, null, 2)
        console.log('Saving report to:', filePath)
        fs.writeFileSync(filePath, jsonContent, { encoding: 'binary' })
        console.log('Report saved successfully.')
        break
      }
    }
  }

  /*
   * Get report data based on report type and filters
   */
  private async getReportData(report: Report): Promise<any> {
    // Default empty filter values
    const frameworkIds = report.filter?.getFrameworkIds() || []
    const controlIds = report.filter?.getControlIds() || []
    const riskIds = report.filter?.getRiskIds() || []
    const evidenceIds = report.filter?.getEvidenceIds() || []
    const policyIds = report.filter?.getPolicyIds() || []
    const startDate = report.filter?.getStartDate()
    const endDate = report.filter?.getEndDate()
    const tags = report.filter?.getTags()

    // Base filter options object
    const baseFilterOptions: any = {
      active: true,
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      baseFilterOptions.startDate = startDate
      baseFilterOptions.endDate = endDate
    }

    // Add tags filtering if provided
    if (tags && tags.length > 0) {
      baseFilterOptions.tags = tags
    }

    // Get data based on report type
    switch (report.type) {
      case ReportType.COMPLIANCE_SUMMARY: {
        // Get frameworks
        const frameworksResult = await this.frameworkRepository.findAll({
          ...baseFilterOptions,
          ...(frameworkIds.length > 0 ? { ids: frameworkIds } : {}),
        })

        if (!frameworksResult.isSuccess) {
          throw frameworksResult.getError()
        }

        const frameworks = frameworksResult.getValue()

        // For each framework, get detailed control stats
        const frameworksData = []

        for (const framework of frameworks) {
          // Get all controls for this framework
          const controlsResult = await this.controlRepository.findByFrameworkId(
            framework.id,
            false // includeInactive=false
          )

          if (!controlsResult.isSuccess) {
            throw controlsResult.getError()
          }

          const controls = controlsResult.getValue()

          // Calculate compliance metrics
          const totalControls = controls.length
          const implementedControls = controls.filter(
            (c) => c.implementationStatus === ImplementationStatus.IMPLEMENTED
          ).length
          const partiallyImplementedControls = controls.filter(
            (c) => c.implementationStatus === ImplementationStatus.PARTIALLY_IMPLEMENTED
          ).length
          const notImplementedControls = controls.filter(
            (c) => c.implementationStatus === ImplementationStatus.NOT_IMPLEMENTED
          ).length
          const notApplicableControls = controls.filter(
            (c) => c.implementationStatus === ImplementationStatus.NOT_APPLICABLE
          ).length

          const implementationRate =
            totalControls > 0
              ? ((implementedControls + partiallyImplementedControls * 0.5) /
                  (totalControls - notApplicableControls)) *
                100
              : 0

          frameworksData.push({
            id: framework.id,
            name: framework.name.getValue(),
            version: framework.version.getValue(),
            description: framework.description,
            totalControls,
            implementedControls,
            partiallyImplementedControls,
            notImplementedControls,
            notApplicableControls,
            implementationRate: Math.round(implementationRate * 100) / 100, // Round to 2 decimal places
          })
        }

        return {
          title: 'Compliance Summary Report',
          generatedAt: new Date(),
          frameworks: frameworksData,
        }
      }

      case ReportType.RISK_SUMMARY: {
        // Get risks
        const risksResult = await this.riskRepository.findAll({
          ...baseFilterOptions,
          ...(riskIds.length > 0 ? { ids: riskIds } : {}),
        })

        if (!risksResult.isSuccess) {
          throw risksResult.getError()
        }

        const risks = risksResult.getValue()

        // For each risk, get its treatments
        const risksData = []

        for (const risk of risks) {
          // Get treatments for this risk
          const treatmentsResult = await this.riskTreatmentRepository.findByRiskId(risk.id, {
            active: true,
          })

          if (!treatmentsResult.isSuccess) {
            throw treatmentsResult.getError()
          }

          const treatments = treatmentsResult.getValue()

          risksData.push({
            id: risk.id,
            name: risk.name.getValue(),
            category: risk.category,
            status: risk.status,
            description: risk.description,
            inherentRisk: {
              impact: risk.inherentImpact,
              likelihood: risk.inherentLikelihood,
              score: risk.inherentRiskScore.getValue(),
              severity: risk.inherentRiskScore.getSeverity(),
            },
            residualRisk: risk.residualRiskScore
              ? {
                  impact: risk.residualImpact,
                  likelihood: risk.residualLikelihood,
                  score: risk.residualRiskScore.getValue(),
                  severity: risk.residualRiskScore.getSeverity(),
                }
              : undefined,
            riskReductionPercentage: risk.getRiskReductionPercentage(),
            treatments: treatments.map((t) => ({
              id: t.id,
              name: t.name,
              type: t.type,
              status: t.status,
              dueDate: t.dueDate,
              isOverdue: t.isOverdue(),
              progressPercentage: t.getProgressPercentage(),
            })),
          })
        }

        // Calculate risk statistics
        const risksByStatus = Object.values(RiskStatus).reduce((acc, status) => {
          acc[status] = risks.filter((r) => r.status === status).length
          return acc
        }, {} as Record<RiskStatus, number>)

        const risksBySeverity = Object.values(RiskSeverity).reduce((acc, severity) => {
          acc[severity] = risks.filter((r) => r.inherentRiskScore.getSeverity() === severity).length
          return acc
        }, {} as Record<RiskSeverity, number>)

        return {
          title: 'Risk Assessment Report',
          generatedAt: new Date(),
          summary: {
            totalRisks: risks.length,
            byStatus: risksByStatus,
            bySeverity: risksBySeverity,
          },
          risks: risksData,
        }
      }

      case ReportType.CONTROL_IMPLEMENTATION: {
        // Get controls
        const controlsResult = await this.controlRepository.findAll({
          ...baseFilterOptions,
          ...(controlIds.length > 0 ? { ids: controlIds } : {}),
          ...(frameworkIds.length > 0 ? { frameworkId: frameworkIds[0] } : {}),
        })

        if (!controlsResult.isSuccess) {
          throw controlsResult.getError()
        }

        const controls = controlsResult.getValue()

        // For each control, get its evidence
        const controlsData = []

        for (const control of controls) {
          // Get evidence for this control
          const evidenceResult = await this.evidenceRepository.findByControlId(control.id, {
            active: true,
          })

          if (!evidenceResult.isSuccess) {
            throw evidenceResult.getError()
          }

          const evidence = evidenceResult.getValue()

          // Get framework details
          const frameworkResult = await this.frameworkRepository.findById(control.frameworkId)

          if (!frameworkResult.isSuccess) {
            throw frameworkResult.getError()
          }

          const framework = frameworkResult.getValue()

          controlsData.push({
            id: control.id,
            code: control.code.getValue(),
            title: control.title.getValue(),
            description: control.description,
            implementationStatus: control.implementationStatus,
            implementationDetails: control.implementationDetails,
            framework: framework
              ? {
                  id: framework.id,
                  name: framework.name.getValue(),
                  version: framework.version.getValue(),
                }
              : undefined,
            evidenceCount: evidence.length,
            lastUpdated: control.updatedAt,
          })
        }

        // Calculate control statistics
        const statuses = Object.values(ImplementationStatus)
        const controlsByStatus = statuses.reduce((acc, status) => {
          acc[status] = controls.filter((c) => c.implementationStatus === status).length
          return acc
        }, {} as Record<ImplementationStatus, number>)

        const implementationRate =
          controls.length > 0
            ? ((controlsByStatus[ImplementationStatus.IMPLEMENTED] +
                controlsByStatus[ImplementationStatus.PARTIALLY_IMPLEMENTED] * 0.5) /
                (controls.length - controlsByStatus[ImplementationStatus.NOT_APPLICABLE])) *
              100
            : 0

        return {
          title: 'Control Effectiveness Report',
          generatedAt: new Date(),
          summary: {
            totalControls: controls.length,
            byStatus: controlsByStatus,
            implementationRate: Math.round(implementationRate * 100) / 100, // Round to 2 decimal places
          },
          controls: controlsData,
        }
      }

      case ReportType.AUDIT_READINESS: {
        // Get findings for specified audits
        const findingsResult = await this.findingRepository.findAll({
          ...baseFilterOptions,
          ...(controlIds.length > 0 ? { controlId: controlIds[0] } : {}),
        })

        if (!findingsResult.isSuccess) {
          throw findingsResult.getError()
        }

        const findings = findingsResult.getValue()

        // Map findings to report data
        const findingsData = findings.map((finding) => ({
          id: finding.id,
          auditId: finding.auditId,
          title: finding.title.getValue(),
          description: finding.description,
          type: finding.type,
          severity: finding.severity,
          status: finding.status,
          dueDate: finding.dueDate,
          isOverdue: finding.isOverdue(),
          hasRemediationPlan: !!finding.remediationPlan,
          remediationPlan: finding.remediationPlan
            ? {
                description: finding.remediationPlan.getDescription(),
                dueDate: finding.remediationPlan.getDueDate(),
                assignee: finding.remediationPlan.getAssignee(),
                status: finding.remediationPlan.getStatus(),
              }
            : undefined,
          createdAt: finding.createdAt,
          updatedAt: finding.updatedAt,
        }))

        // Calculate finding statistics
        const findingsByStatus = Object.values(FindingStatus).reduce((acc, status) => {
          acc[status] = findings.filter((f) => f.status === status).length
          return acc
        }, {} as Record<FindingStatus, number>)

        const findingsBySeverity = Object.values(FindingSeverity).reduce((acc, severity) => {
          acc[severity] = findings.filter((f) => f.severity === severity).length
          return acc
        }, {} as Record<FindingSeverity, number>)

        const overdueFindings = findings.filter((f) => f.isOverdue()).length

        return {
          title: 'Audit Findings Report',
          generatedAt: new Date(),
          summary: {
            totalFindings: findings.length,
            byStatus: findingsByStatus,
            bySeverity: findingsBySeverity,
            overdueFindings,
          },
          findings: findingsData,
        }
      }

      case ReportType.POLICY_SUMMARY: {
        // Get policies
        const policiesResult = await this.policyRepository.findAll({
          ...baseFilterOptions,
          ...(policyIds.length > 0 ? { ids: policyIds } : {}),
        })

        if (!policiesResult.isSuccess) {
          throw policiesResult.getError()
        }

        const policies = policiesResult.getValue()

        // Map policies to report data
        const policiesData = policies.map((policy) => ({
          id: policy.id,
          name: policy.name.getValue(),
          version: policy.version.getValue(),
          type: policy.type,
          status: policy.status,
          description: policy.description,
          owner: policy.owner,
          effectiveDate: policy.effectiveDate
            ? {
                startDate: policy.effectiveDate.getStartDate(),
                endDate: policy.effectiveDate.getEndDate(),
              }
            : undefined,
          isEffective: policy.isEffective(),
          reviewDate: policy.reviewDate,
          approverCount: policy.approvers?.length || 0,
          controlCount: policy.relatedControlIds?.length || 0,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
        }))

        // Get policies due for review
        const policiesDueForReview = policies.filter((p) => {
          if (!p.reviewDate) return false
          return p.reviewDate <= new Date()
        }).length

        // Get effective policies
        const effectivePolicies = policies.filter((p) => p.isEffective()).length

        // Group policies by status
        const policyStatusCounts = Object.values(PolicyStatus).reduce((acc, status) => {
          acc[status] = policies.filter((p) => p.status === status).length
          return acc
        }, {} as Record<PolicyStatus, number>)

        return {
          title: 'Policy Management Report',
          generatedAt: new Date(),
          summary: {
            totalPolicies: policies.length,
            byType: policies.reduce((acc, p) => {
              acc[p.type] = (acc[p.type] || 0) + 1
              return acc
            }, {} as Record<string, number>),
            byStatus: policyStatusCounts,
            policiesDueForReview,
            effectivePolicies,
          },
          policies: policiesData,
        }
      }

      case ReportType.CUSTOM:
      default: {
        // For custom reports, we'll use custom filters provided
        const customFilters = report.filter?.getCustomFilters() || {}

        // Execute custom logic based on filters
        // For this implementation, we'll just return a basic structure
        return {
          title: report.name.getValue(),
          description: 'Custom report',
          generatedAt: new Date(),
          filters: {
            ...customFilters,
            frameworkIds,
            controlIds,
            riskIds,
            evidenceIds,
            policyIds,
            startDate,
            endDate,
            tags,
          },
        }
      }
    }
  }

  /**
   * Generate a report
   */
  public async generateReport(
    reportId: string,
    userId: string
  ): Promise<Result<{ report: Report; fileUrl: string }, Error>> {
    // Find report
    const reportResult = await this.reportRepository.findById(reportId)

    if (!reportResult.isSuccess) {
      return Result.fail(reportResult.getError())
    }

    const report = reportResult.getValue()

    if (!report) {
      return Result.fail(new Error(`Report with ID ${reportId} not found`))
    }

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../../uploads/reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    // Generate filename
    const timestamp = Date.now()

    let fileExtension: string
    switch (report.format) {
      case ReportFormat.JSON:
        fileExtension = 'json'
        break
      case ReportFormat.CSV:
        fileExtension = 'csv'
        break
      case ReportFormat.EXCEL:
        fileExtension = 'xlsx' // Use xlsx for Excel files
        break
      case ReportFormat.PDF:
        fileExtension = 'pdf'
        break
      default:
        fileExtension = report.format.toLowerCase()
    }
    const filename = `report_${reportId}_${timestamp}.${fileExtension}`
    const filePath = path.join(reportsDir, filename)
    const fileUrl = `/uploads/reports/${filename}`

    try {
      // Get report data based on report type and filters
      const reportData = await this.getReportData(report)

      // Format the data based on report format
      await this.formatAndSaveReport(reportData, report.format, filePath)

      // Update report with generation info
      const updateResult = report.markGenerated(userId, fileUrl)

      if (!updateResult.isSuccess) {
        return Result.fail(updateResult.getError())
      }

      // Save updated report to repository
      const saveResult = await this.reportRepository.save(report)

      if (!saveResult.isSuccess) {
        return Result.fail(saveResult.getError())
      }

      return Result.ok({
        report,
        fileUrl,
      })
    } catch (error) {
      // Clean up any partially created file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      return Result.fail(error instanceof Error ? error : new Error('Failed to generate report'))
    }
  }

  /**
   * Create a new dashboard
   */
  public async createDashboard(
    name: DashboardName,
    type: DashboardType,
    description: string,
    userId: string,
    options?: {
      widgets?: DashboardWidget[]
      isDefault?: boolean
    }
  ): Promise<Result<Dashboard, Error>> {
    // Check if this is set as default and update existing default if needed
    if (options?.isDefault) {
      const existingDefaultResult = await this.dashboardRepository.findDefaultByType(type)

      if (!existingDefaultResult.isSuccess) {
        return Result.fail<Dashboard>(existingDefaultResult.getError())
      }

      const existingDefault = existingDefaultResult.getValue()

      if (existingDefault) {
        // Update existing default dashboard
        const updateResult = existingDefault.unsetAsDefault(userId)

        if (!updateResult.isSuccess) {
          return Result.fail<Dashboard>(updateResult.getError())
        }

        const saveResult = await this.dashboardRepository.save(existingDefault)

        if (!saveResult.isSuccess) {
          return Result.fail<Dashboard>(saveResult.getError())
        }
      }
    }

    // Create dashboard entity
    const dashboardId = new mongoose.Types.ObjectId().toString()
    const dashboardResult = Dashboard.create(dashboardId, {
      name,
      type,
      description,
      widgets: options?.widgets,
      isDefault: options?.isDefault,
      createdBy: userId,
    })

    if (!dashboardResult.isSuccess) {
      return Result.fail<Dashboard>(dashboardResult.getError())
    }

    const dashboard = dashboardResult.getValue()

    // Save dashboard to repository
    const saveResult = await this.dashboardRepository.save(dashboard)

    if (!saveResult.isSuccess) {
      return Result.fail<Dashboard>(saveResult.getError())
    }

    return Result.ok<Dashboard>(dashboard)
  }

  /**
   * Create a new metric
   */
  public async createMetric(
    name: MetricName,
    type: MetricType,
    description: string,
    calculationMethod: MetricCalculationMethod,
    query: string,
    userId: string,
    options?: {
      unit?: string
      thresholds?: {
        critical?: number
        warning?: number
        target?: number
      }
    }
  ): Promise<Result<Metric, Error>> {
    // Create metric entity
    const metricId = new mongoose.Types.ObjectId().toString()
    const metricResult = Metric.create(metricId, {
      name,
      type,
      description,
      calculationMethod,
      query,
      unit: options?.unit,
      thresholds: options?.thresholds,
      createdBy: userId,
    })

    if (!metricResult.isSuccess) {
      return Result.fail<Metric>(metricResult.getError())
    }

    const metric = metricResult.getValue()

    // Save metric to repository
    const saveResult = await this.metricRepository.save(metric)

    if (!saveResult.isSuccess) {
      return Result.fail<Metric>(saveResult.getError())
    }

    return Result.ok<Metric>(metric)
  }

  /**
   * Calculate metric value
   */
  public async calculateMetric(metricId: string, userId: string): Promise<Result<Metric, Error>> {
    // Find metric
    const metricResult = await this.metricRepository.findById(metricId)

    if (!metricResult.isSuccess) {
      return Result.fail<Metric>(metricResult.getError())
    }

    const metric = metricResult.getValue()

    if (!metric) {
      return Result.fail<Metric>(new Error(`Metric with ID ${metricId} not found`))
    }

    // TODO: Implement actual metric calculation logic
    // This would involve executing the query and calculating the value

    // For now, we'll just fake a value
    const value = Math.random() * 100

    // Update metric with new value
    const updateResult = metric.updateValue(value, userId)

    if (!updateResult.isSuccess) {
      return Result.fail<Metric>(updateResult.getError())
    }

    // Save updated metric to repository
    const saveResult = await this.metricRepository.save(metric)

    if (!saveResult.isSuccess) {
      return Result.fail<Metric>(saveResult.getError())
    }

    return Result.ok<Metric>(metric)
  }

  /**
   * Process scheduled reports
   */
  public async processScheduledReports(userId: string): Promise<
    Result<
      {
        processed: number
        succeeded: number
        failed: number
        errors: Error[]
      },
      Error
    >
  > {
    // Find all reports scheduled to run before now
    const now = new Date()
    const reportsResult = await this.reportRepository.findScheduledReports(now)

    if (!reportsResult.isSuccess) {
      return Result.fail(reportsResult.getError())
    }

    const reports = reportsResult.getValue()
    const results = {
      processed: reports.length,
      succeeded: 0,
      failed: 0,
      errors: [] as Error[],
    }

    // Process each report
    for (const report of reports) {
      try {
        const generateResult = await this.generateReport(report.id, userId)

        if (!generateResult.isSuccess) {
          results.failed++
          results.errors.push(generateResult.getError())
        } else {
          results.succeeded++
        }
      } catch (error) {
        results.failed++
        results.errors.push(error instanceof Error ? error : new Error('Unknown error'))
      }
    }

    return Result.ok(results)
  }
}
