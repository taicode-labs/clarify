import { ApiEndpointCard, DocShell } from '@clarify/renderer';

export default function App() {
  return (
    <DocShell
      title="Clarify Docs"
      subtitle="Compose MDX + interactive React components + OpenAPI from one modern docs workflow."
    >
      <section className="grid gap-5 md:grid-cols-2">
        <ApiEndpointCard
          method="GET"
          path="/v1/projects"
          description="List all projects accessible by the current user."
        />
        <ApiEndpointCard
          method="POST"
          path="/v1/projects"
          description="Create a new project with optional metadata and default settings."
        />
      </section>
    </DocShell>
  );
}
