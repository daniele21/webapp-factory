import React from 'react'
import Chart from 'react-apexcharts'
import { useSeriesColors } from './ChartTheme'

type Series = { name: string; data: number[] }

export default function ChartApex({ series, height = 320 }: { series: Series[]; height?: number }) {
  const colors = useSeriesColors()

  const options: any = {
    chart: {
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false }
    },
    stroke: { curve: 'smooth' },
    colors,
    xaxis: { categories: series[0]?.data.map((_, i) => `P${i + 1}`) },
    legend: { position: 'top' },
    tooltip: { theme: 'dark' }
  }

  return <Chart options={options} series={series as any} type="line" height={height} />
}
