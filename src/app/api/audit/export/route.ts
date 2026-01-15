/**
 * POST /api/audit/export
 *
 * Generates audit data exports in TOON, JSON, or CSV formats.
 *
 * Request Body:
 *   {
 *     "format": "toon" | "json" | "csv",
 *     "type": "traces" | "decisions" | "full_audit",
 *     "dateRange": "24h" | "7d" | "30d" | "all" | "custom",
 *     "customStartDate": "ISO date string" (optional),
 *     "customEndDate": "ISO date string" (optional),
 *     "agentFilter": "agent name" (optional),
 *     "statusFilter": ["completed", "failed"] (optional),
 *     "includeSpans": boolean,
 *     "includeDecisions": boolean
 *   }
 *
 * Response:
 *   - For downloads: Binary file with appropriate Content-Type
 *   - For metadata: { success, format, filename, recordCount, byteSize, downloadUrl }
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportData, exportDecisions, type ExportConfig, type ExportResult } from '@/lib/audit/exporter';

export const dynamic = 'force-dynamic';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

interface ExportResponse {
  success: boolean;
  format: string;
  filename: string;
  recordCount: number;
  byteSize: number;
  downloadUrl?: string;
  content?: string;
}

/**
 * Validate export configuration.
 */
function validateConfig(config: Partial<ExportConfig>): string[] {
  const errors: string[] = [];

  const validFormats = ['toon', 'json', 'csv'];
  if (!config.format || !validFormats.includes(config.format)) {
    errors.push(`format must be one of: ${validFormats.join(', ')}`);
  }

  const validTypes = ['traces', 'decisions', 'full_audit'];
  if (!config.type || !validTypes.includes(config.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }

  const validDateRanges = ['24h', '7d', '30d', 'all', 'custom'];
  if (!config.dateRange || !validDateRanges.includes(config.dateRange)) {
    errors.push(`dateRange must be one of: ${validDateRanges.join(', ')}`);
  }

  if (config.dateRange === 'custom') {
    if (!config.customStartDate && !config.customEndDate) {
      errors.push('customStartDate or customEndDate required when dateRange is custom');
    }
  }

  return errors;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ExportResponse | ErrorResponse | Blob>> {
  try {
    // Parse request body
    let config: Partial<ExportConfig>;
    try {
      config = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON body',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: validationErrors.join('; '),
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Set defaults
    const fullConfig: ExportConfig = {
      format: config.format as ExportConfig['format'],
      type: config.type as ExportConfig['type'],
      dateRange: config.dateRange as ExportConfig['dateRange'],
      customStartDate: config.customStartDate,
      customEndDate: config.customEndDate,
      agentFilter: config.agentFilter,
      statusFilter: config.statusFilter,
      includeSpans: config.includeSpans ?? true,
      includeDecisions: config.includeDecisions ?? true,
    };

    // Generate export
    let result: ExportResult;
    if (fullConfig.type === 'decisions') {
      result = await exportDecisions(fullConfig);
    } else {
      result = await exportData(fullConfig);
    }

    // Check if client wants download or metadata
    const wantDownload = request.headers.get('Accept')?.includes('application/octet-stream');

    if (wantDownload) {
      // Return file directly
      return new NextResponse(result.content, {
        status: 200,
        headers: {
          'Content-Type': result.mimeType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'Content-Length': String(result.byteSize),
        },
      });
    }

    // Return metadata with content
    const response: ExportResponse = {
      success: result.success,
      format: result.format,
      filename: result.filename,
      recordCount: result.recordCount,
      byteSize: result.byteSize,
      content: result.content,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: errorMessage,
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/audit/export
 *
 * Returns information about the export endpoint.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/audit/export',
    methods: ['POST'],
    formats: ['toon', 'json', 'csv'],
    types: ['traces', 'decisions', 'full_audit'],
    dateRanges: ['24h', '7d', '30d', 'all', 'custom'],
    description: 'Generate audit data exports for analysis or LLM consumption',
    toon: {
      description: 'Token-Oriented Object Notation - optimized for LLM token efficiency',
      savings: '30-60% fewer tokens compared to JSON',
    },
  });
}
