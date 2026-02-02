import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import type { CategoryStats } from '@/types'
import { formatAmount } from '@/config/constants'

interface CategoryPieChartProps {
  data: CategoryStats[]
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [activeData, setActiveData] = useState<{ name: string; value: number } | null>(null)

  // Take top 5 categories and group rest as "Others"
  const topCategories = data.slice(0, 5)
  const othersTotal = data.slice(5).reduce((sum, cat) => sum + cat.total, 0)

  const chartData = othersTotal > 0
    ? [
        ...topCategories.map((cat) => ({
          name: cat.categoryName,
          value: cat.total,
          color: cat.categoryColor,
        })),
        { name: 'Others', value: othersTotal, color: '#71717a' },
      ]
    : topCategories.map((cat) => ({
        name: cat.categoryName,
        value: cat.total,
        color: cat.categoryColor,
      }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveData(chartData[index])}
            onMouseLeave={() => setActiveData(null)}
            onClick={(_, index) => setActiveData(chartData[index])}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ cursor: 'pointer', outline: 'none' }}
              />
            ))}
          </Pie>
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            formatter={(value) => (
              <span className="text-xs text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text showing active/total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-20px' }}>
        <div className="text-center">
          {activeData ? (
            <>
              <p className="text-xs text-muted-foreground font-medium">{activeData.name}</p>
              <p className="text-sm font-bold">{formatAmount(activeData.value)}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold">{formatAmount(total)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
