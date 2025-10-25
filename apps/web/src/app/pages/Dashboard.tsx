import ChartApex from '../components/ChartApex'

export default function Dashboard() {
  const series = [
    { name: 'Series A', data: [10, 41, 35, 51, 49, 62, 69] },
    { name: 'Series B', data: [23, 12, 54, 61, 32, 45, 33] }
  ]

  return (
    <div className="prose">
      <h2>Dashboard</h2>
      <p>Starter page.</p>
      <div className="mt-6">
        <ChartApex series={series} />
      </div>
    </div>
  )
}
