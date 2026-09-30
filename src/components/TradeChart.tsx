import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from 'recharts';
import { ChartPoint } from '@/lib/types';

interface Props {
  data: ChartPoint[];
}

export default function TradeChart({ data }: Props) {
  return (
    <div className="h-64 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip formatter={(value) => { if (typeof value === 'number') {return `$${value.toFixed(2)}`;} return value;}} />
          <Line type="stepAfter" dataKey="target" stroke="#9ca3af" strokeDasharray="4 4" dot={false} name="Meta" />
          <Line
            type="monotone"
            dataKey="pool"
            stroke="#10b981"
            strokeWidth={2}
            name="Pool"
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return payload.harvested ? (
                <Dot key={`dot-${payload.index}`} cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
              ) : (
                <Dot key={`dot-${payload.index}`} cx={cx} cy={cy} r={3} fill="#10b981" />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}