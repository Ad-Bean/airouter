'use client';

import { ApiDocsLayout } from './ApiDocsLayout';
import {
  ApiOverviewSection,
  AuthenticationSection,
  EndpointsSection,
  ModelsSection,
  ModelPages,
} from './ApiDocumentationSections';

export function ApiDocsTestLayout() {
  return (
    <ApiDocsLayout>
      <ApiOverviewSection />
      <AuthenticationSection />
      <EndpointsSection />
      <ModelsSection />
      <ModelPages />
    </ApiDocsLayout>
  );
}
