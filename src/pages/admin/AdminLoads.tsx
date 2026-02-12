import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Box } from 'lucide-react';

export default function AdminLoads() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoads = async () => {
    const data = await api.getAllLoads();
    setLoads(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('admin-loads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-800">إدارة كافة الشحنات</h2>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">المسار</TableHead>
                <TableHead className="font-bold">الشاحن</TableHead>
                <TableHead className="font-bold">الحالة</TableHead>
                <TableHead className="font-bold">السعر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loads.map((load) => (
                <TableRow key={load.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <MapPin size={14} className="text-primary" /> {load.origin} ← {load.destination}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">{load.profiles?.full_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                        load.status === 'available' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'
                    }>{load.status}</Badge>
                  </TableCell>
                  <TableCell className="font-black text-slate-800">{load.price} ر.س</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
