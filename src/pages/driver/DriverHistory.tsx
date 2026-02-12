import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DriverHistory() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchMyLoads = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data as any[] || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoads();

    const channel = supabase
      .channel('my-loads-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => {
        fetchMyLoads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  // دالة إلغاء القبول (إعادة الشحنة للمتاحة)
  const handleCancelAssignment = async (loadId: string) => {
    setCancellingId(loadId);
    try {
      await api.cancelLoadAssignment(loadId);
      toast.success("تم إلغاء الشحنة وإعادتها للقائمة العامة");
    } catch (err: any) {
      toast.error("فشل الإلغاء: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">شحناتي الحالية والسابقة</h2>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : loads.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl text-muted-foreground">
            لا توجد شحنات مرتبطة بحسابك حالياً
          </div>
        ) : (
          <div className="grid gap-4">
            {loads.map((load) => (
              <Card key={load.id} className="overflow-hidden border-r-4 border-r-primary">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <Badge className={load.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                      {t(load.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(load.created_at).toLocaleDateString('ar')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-lg font-bold mb-4">
                    <MapPin size={18} className="text-primary" />
                    {load.origin} → {load.destination}
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="text-sm text-muted-foreground">
                      <p>الوزن: {load.weight} طن</p>
                      <p className="font-bold text-slate-800">السعر: {load.price} ر.س</p>
                    </div>

                    {/* زر الإلغاء (سلة المحذوفات) يظهر فقط للشحنات قيد التنفيذ */}
                    {load.status === 'in_progress' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full h-12 w-12">
                            {cancellingId === load.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={24} />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="text-destructive" />
                                تراجع عن قبول الشحنة؟
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد؟ سيؤدي هذا لإعادة الشحنة لقائمة "الشحنات المتاحة" ليراها السائقون الآخرون وتختفي من عندك.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleCancelAssignment(load.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            >
                              نعم، أحذفها من عندي
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
