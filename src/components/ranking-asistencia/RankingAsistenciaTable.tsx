import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RankingItem {
  nombre: string;
  dias: number;
}

export default function RankingAsistenciaTable() {
  const [data, setData] = useState<RankingItem[]>([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    fetch(`/api/ranking-asistencia?mes=${mes}&anio=${anio}`)
      .then((res) => res.json())
      .then(setData);
  }, [mes, anio]);

  return (
    <div>
      <div className='flex gap-4 mb-4'>
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className='flex items-center justify-between w-32 h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('es', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={anio}
          onChange={(e) => setAnio(parseInt(e.target.value))}
          className='flex items-center justify-between w-32 h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {Array.from({ length: 3 }, (_, i) => (
            <option key={2023 + i} value={2023 + i}>
              {2023 + i}
            </option>
          ))}
        </select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Posición</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Días Asistidos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 10).map((item, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.nombre}</TableCell>
              <TableCell>{item.dias}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}