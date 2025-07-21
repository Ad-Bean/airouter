'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

// Types for API documentation
export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string | number | boolean;
  examples?: (string | number | boolean | string[])[];
  enum?: string[];
  format?: string;
}

export interface ApiResponse {
  status: number;
  description: string;
  example: unknown;
  schema?: unknown;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  authentication?: 'required' | 'optional' | 'none';
  parameters?: {
    path?: ApiParameter[];
    query?: ApiParameter[];
    body?: ApiParameter[];
    headers?: ApiParameter[];
  };
  responses: ApiResponse[];
  examples?: {
    request?: string | Record<string, unknown>;
    response?: string | Record<string, unknown>;
  };
  notes?: string[];
  deprecated?: boolean;
}

interface ApiEndpointDocProps {
  endpoint: ApiEndpoint;
  children?: ReactNode;
}

export function ApiEndpointDoc({ endpoint, children }: ApiEndpointDocProps) {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'POST':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PUT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAuthBadgeColor = (auth?: string) => {
    switch (auth) {
      case 'required':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'optional':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'none':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div id={endpoint.id} className="mb-12 scroll-mt-8">
      {/* Endpoint Header */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <Badge className={`px-3 py-1 font-mono text-sm ${getMethodColor(endpoint.method)}`}>
            {endpoint.method}
          </Badge>
          <code className="rounded bg-gray-100 px-3 py-1 font-mono text-lg dark:bg-gray-800">
            {endpoint.path}
          </code>
          {endpoint.authentication && (
            <Badge className={`px-2 py-1 text-xs ${getAuthBadgeColor(endpoint.authentication)}`}>
              Auth {endpoint.authentication}
            </Badge>
          )}
          {endpoint.deprecated && (
            <Badge className="bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
              Deprecated
            </Badge>
          )}
        </div>
        <h3 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {endpoint.title}
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-300">{endpoint.description}</p>
      </div>

      {/* Parameters Section */}
      {endpoint.parameters && (
        <div className="mb-8">
          <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Parameters</h4>
          <div className="space-y-6">
            {endpoint.parameters.headers && endpoint.parameters.headers.length > 0 && (
              <ParameterSection title="Headers" parameters={endpoint.parameters.headers} />
            )}
            {endpoint.parameters.path && endpoint.parameters.path.length > 0 && (
              <ParameterSection title="Path Parameters" parameters={endpoint.parameters.path} />
            )}
            {endpoint.parameters.query && endpoint.parameters.query.length > 0 && (
              <ParameterSection title="Query Parameters" parameters={endpoint.parameters.query} />
            )}
            {endpoint.parameters.body && endpoint.parameters.body.length > 0 && (
              <ParameterSection title="Request Body" parameters={endpoint.parameters.body} />
            )}
          </div>
        </div>
      )}

      {/* Responses Section */}
      <div className="mb-8">
        <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Responses</h4>
        <div className="space-y-4">
          {endpoint.responses.map((response, index) => (
            <ResponseDoc key={index} response={response} />
          ))}
        </div>
      </div>

      {/* Examples Section */}
      {endpoint.examples && (
        <div className="mb-8">
          <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Examples</h4>
          <div className="space-y-4">
            {endpoint.examples.request && (
              <div>
                <h5 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  Example Request
                </h5>
                <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                  <code className="text-sm">
                    {typeof endpoint.examples.request === 'string'
                      ? endpoint.examples.request
                      : JSON.stringify(endpoint.examples.request, null, 2)}
                  </code>
                </pre>
              </div>
            )}
            {endpoint.examples.response && (
              <div>
                <h5 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  Example Response
                </h5>
                <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                  <code className="text-sm">
                    {typeof endpoint.examples.response === 'string'
                      ? endpoint.examples.response
                      : JSON.stringify(endpoint.examples.response, null, 2)}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {endpoint.notes && endpoint.notes.length > 0 && (
        <div className="mb-8">
          <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Notes</h4>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-300">
            {endpoint.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {children}
    </div>
  );
}

interface ParameterSectionProps {
  title: string;
  parameters: ApiParameter[];
}

function ParameterSection({ title, parameters }: ParameterSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {parameters.map((param, index) => (
            <ParameterDoc key={index} parameter={param} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ParameterDocProps {
  parameter: ApiParameter;
}

function ParameterDoc({ parameter }: ParameterDocProps) {
  return (
    <div className="border-l-4 border-blue-200 pl-4 dark:border-blue-800">
      <div className="mb-2 flex items-center gap-2">
        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800">
          {parameter.name}
        </code>
        <Badge
          className={`text-xs ${
            parameter.required
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {parameter.required ? 'Required' : 'Optional'}
        </Badge>
        <Badge className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {parameter.type}
        </Badge>
        {parameter.format && (
          <Badge className="bg-purple-100 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {parameter.format}
          </Badge>
        )}
      </div>
      <p className="mb-2 text-gray-600 dark:text-gray-300">{parameter.description}</p>

      {parameter.default !== undefined && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default: </span>
          <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
            {JSON.stringify(parameter.default)}
          </code>
        </div>
      )}

      {parameter.enum && parameter.enum.length > 0 && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Allowed values:{' '}
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {parameter.enum.map((value, index) => (
              <code key={index} className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                {value}
              </code>
            ))}
          </div>
        </div>
      )}

      {parameter.examples && parameter.examples.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Examples: </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {parameter.examples.map((example, index) => (
              <code
                key={index}
                className="rounded bg-green-100 px-2 py-1 text-xs dark:bg-green-800"
              >
                {JSON.stringify(example)}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ResponseDocProps {
  response: ApiResponse;
}

function ResponseDoc({ response }: ResponseDocProps) {
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (status >= 400 && status < 500) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (status >= 500) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1 font-mono ${getStatusColor(response.status)}`}>
            {response.status}
          </Badge>
          <span className="text-gray-600 dark:text-gray-300">{response.description}</span>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <code className="text-sm">
            {typeof response.example === 'string'
              ? response.example
              : JSON.stringify(response.example, null, 2)}
          </code>
        </pre>
      </CardContent>
    </Card>
  );
}
