import ChartApex from '../components/ChartApex'
import { Page, Card } from '../components/factory'

export default function Dashboard() {
  const series = [
    { name: 'Series A', data: [10, 41, 35, 51, 49, 62, 69] },
    { name: 'Series B', data: [23, 12, 54, 61, 32, 45, 33] }
  ]

  return (
    <Page
      title="Dashboard"
      description="Starter analytics surface wired to the shared Chart theme."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="MRR trend" description="Replace with your own data source.">
          <ChartApex series={series} />
        </Card>
        <Card title="What to build next" elevation="flat">
          <ul className="space-y-3 text-sm text-muted-fg">
            <li>• Connect queries via TanStack Query in <code>features/</code>.</li>
            <li>• Gate data behind FastAPI endpoints under <code>apps/api/routes</code>.</li>
            <li>• Toggle feature flags using the shared <code>packages/feature-flags</code> utility.</li>
            <li>• Document domain logic with the provided docs folder.</li>
          </ul>
        </Card>
      </div>
    </Page>
  )
}
