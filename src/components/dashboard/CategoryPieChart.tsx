import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CategoryStats } from '@/types'
import { formatAmount } from '@/config/constants'

interface CategoryPieChartProps {
  data: CategoryStats[]
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
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

  return (
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
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatAmount(value as number)}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
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
  )
}
