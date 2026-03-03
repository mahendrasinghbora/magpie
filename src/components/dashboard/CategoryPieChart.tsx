import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { CategoryStats } from '@/types'
import { formatAmount } from '@/config/constants'

interface CategoryPieChartProps {
  data: CategoryStats[]
  onCategoryClick?: (categoryId: string) => void
}

export function CategoryPieChart({ data, onCategoryClick }: CategoryPieChartProps) {
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
          categoryId: cat.categoryId,
        })),
        { name: 'Others', value: othersTotal, color: '#71717a', categoryId: '' },
      ]
    : topCategories.map((cat) => ({
        name: cat.categoryName,
        value: cat.total,
        color: cat.categoryColor,
        categoryId: cat.categoryId,
      }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveData(chartData[index])}
            onMouseLeave={() => setActiveData(null)}
            onClick={(_, index) => {
              const item = chartData[index]
              setActiveData(item)
              if (onCategoryClick && item.categoryId) {
                onCategoryClick(item.categoryId)
              }
            }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ cursor: 'pointer', outline: 'none' }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center text showing active/total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
