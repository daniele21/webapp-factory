import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Action as KBarAction } from 'kbar'
import { z } from 'zod'
import {
  Page,
  Breadcrumbs,
  TextField,
  SelectField,
  MultiSelectField,
  DatePickerField,
  CheckboxField,
  SwitchField,
  TagInput,
  FileDropzone,
  FactoryForm,
  DataTable,
  StatCard,
  Card,
  KeyValue,
  Timeline,
  CodeBlock,
  Alert,
  Progress,
  Stepper,
  EmptyState,
  Skeleton,
  SearchBar,
  Tabs,
  Pills,
  Accordion,
  Pagination,
  OverflowMenu,
  CommandMenu,
  OAuthButton,
  StyleShowcase,
  type TableQuery,
  type TablePage,
  useToast,
} from '../components/design-system'
import { Button } from '../components/ui/button'

const formSchema = z.object({
  fullName: z.string().min(2),
  role: z.string().min(1),
  startDate: z.date().optional(),
})

const tableData = Array.from({ length: 42 }).map((_, index) => ({
  id: `user-${index + 1}`,
  name: `Person ${index + 1}`,
  role: index % 2 === 0 ? 'Product' : 'Ops',
  status: index % 3 === 0 ? 'Invited' : 'Active',
  lastActive: new Date(Date.now() - index * 8.64e7).toISOString(),
}))

type Row = (typeof tableData)[number]

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'lastActive',
    header: 'Last active',
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
]

const fetcher = async (query: TableQuery): Promise<TablePage<Row>> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const sorted = [...tableData]
  if (query.sort) {
    sorted.sort((a: any, b: any) => {
      const lhs = a[query.sort!.id]
      const rhs = b[query.sort!.id]
      if (lhs < rhs) return query.sort!.desc ? 1 : -1
      if (lhs > rhs) return query.sort!.desc ? -1 : 1
      return 0
    })
  }
  const start = query.page * query.pageSize
  const sliced = sorted.slice(start, start + query.pageSize)
  return { data: sliced, page: query.page, pageSize: query.pageSize, total: tableData.length }
}

const commandActions: KBarAction[] = [
  { id: 'home', name: 'Go to dashboard', shortcut: ['g', 'd'], keywords: 'navigate dashboard', perform: () => (window.location.href = '/home') },
  { id: 'style', name: 'Open style demo', shortcut: ['g', 's'], keywords: 'theme style', perform: () => (window.location.href = '/style-demo') },
]

export default function UiLibrary() {
  const [tab, setTab] = useState('forms')
  const [pill, setPill] = useState('all')
  const [page, setPage] = useState(1)
  const { notify } = useToast()

  return (
    <Page
      title="Webapp Factory components"
      description="Tiered component set ready for any React + FastAPI workload."
      toolbar={<Breadcrumbs homeLabel="Factory" />}
      actions={<OAuthButton />}
    >
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tier 1 — Forms</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Full name" placeholder="Ada Lovelace" required />
          <SelectField label="Role" options={[{ label: 'Product', value: 'product' }, { label: 'Ops', value: 'ops' }]} placeholder="Select role" />
          <MultiSelectField label="Stacks" options={[{ label: 'React', value: 'react' }, { label: 'FastAPI', value: 'fastapi' }, { label: 'Supabase', value: 'supabase' }]} />
          <DatePickerField label="Start date" />
          <CheckboxField label="Enable notifications" description="We’ll keep you posted." defaultChecked />
          <SwitchField label="Billing lock" description="Freeze invoices" />
          <TagInput label="Topics" suggestions={[{ label: 'Compliance', value: 'compliance' }, { label: 'AI', value: 'ai' }]} />
          <FileDropzone label="Design brief" description="Drop PDF or images" />
        </div>
        <FactoryForm schema={formSchema} onSubmit={async () => notify({ title: 'Draft saved', intent: 'success' })}>
          {() => <TextField label="Owner" placeholder="team@factory.app" />}
        </FactoryForm>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tier 2 — Data display</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="MRR" value="$42k" delta="↑12%" trend="up" />
          <StatCard label="Net retention" value="126%" delta="Stable" trend="neutral" />
          <StatCard label="Tickets" value="87" delta="−8%" trend="down" />
        </div>
        <DataTable columns={columns} fetcher={fetcher} />
        <KeyValue
          items={[
            { key: 'Workspace', value: 'Acme Demo', copyable: true },
            { key: 'Plan', value: 'Scale' },
            { key: 'Owner', value: 'team@factory.app' },
            { key: 'Region', value: 'us-east-1' },
          ]}
        />
        <Timeline
          items={[
            { id: '1', title: 'Provisioned database', timestamp: new Date().toISOString(), description: 'Created analytics replica', badge: 'Auto' },
            { id: '2', title: 'Invited design lead', timestamp: new Date().toISOString(), description: 'Sent invite to diana@design', by: 'Ops bot' },
          ]}
        />
        <CodeBlock language="tsx" highlightLines={[2]} code={`const flags = useFeatureFlags()\nif (flags.aiDrafts) {\n  enableAIAssist()\n}`} />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tier 3 — Feedback & overlays</h2>
        <Alert
          title="Billing sync paused"
          description="Resume to keep usage data fresh."
          intent="warning"
          actions={<Button size="sm">Resume sync</Button>}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Progress" description="API rollout">
            <Progress value={72} />
          </Card>
          <Card title="Milestones" description="Quarter close">
            <Stepper
              steps={[
                { id: 'scope', label: 'Scope', status: 'complete' },
                { id: 'build', label: 'Build', status: 'current' },
                { id: 'review', label: 'Review', status: 'pending' },
              ]}
            />
          </Card>
          <Card title="Skeleton loader">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="mt-2 h-6 w-1/2" />
          </Card>
        </div>
        <EmptyState
          title="No alerts"
          description="You’re caught up. Keep shipping!"
          primaryAction={<Button onClick={() => notify({ title: 'Pretend alert', intent: 'info', description: 'Sample toast' })}>Trigger toast</Button>}
          secondaryAction={<Button variant="outline">Create rule</Button>}
        />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tier 4 — Navigation</h2>
        <SearchBar onSearch={(input: string) => notify({ title: `Searching for ${input}`, intent: 'info' })} recent={['Changelog', 'Invoices', 'AI assistants']} />
        <Tabs
          value={tab}
          onValueChange={setTab}
          tabs={[
            { id: 'forms', label: 'Forms', content: <p className="text-sm text-muted-fg">Text, select, date, and file pickers.</p> },
            { id: 'data', label: 'Data', content: <p className="text-sm text-muted-fg">Tables, stats, timelines.</p> },
          ]}
        />
        <Pills
          value={pill}
          onChange={setPill}
          items={[
            { id: 'all', label: 'All' },
            { id: 'beta', label: 'Beta' },
            { id: 'labs', label: 'Labs' },
          ]}
        />
        <Accordion
          items={[
            { id: 'security', title: 'Security', content: 'SOC2 Type II, SSO, and regional data residency.' },
            { id: 'support', title: 'Support', content: '24/5 chat and dedicated CSM.' },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Pagination page={page} totalPages={5} onChange={setPage} />
          <OverflowMenu
            actions={[
              { id: 'export', label: 'Export data', onSelect: () => notify({ title: 'Export queued', intent: 'success' }) },
              { id: 'archive', label: 'Archive workspace', onSelect: () => notify({ title: 'Archive started', intent: 'info' }) },
            ]}
          />
        </div>
      </section>
      <CommandMenu actions={commandActions} />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Design systems</h2>
        <p className="text-sm text-muted-fg">Toggle between visual styles and brands to preview how the factory tokens adapt.</p>
        <StyleShowcase />
      </section>
    </Page>
  )
}
