import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // --- Auth & Profile ---
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    return { session: data.session, user: data.user, profile: profile as UserProfile, role: roleData?.role as UserRole };
  },

  async updateProfile(userId: string, updates: any) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
  },

  // --- Storage (رفع الصور) ---
  async uploadFile(path: string, file: File) {
    const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
    return publicUrl;
  },

  // --- Loads & Trips ---
  async getAvailableLoads() {
    const { data, error } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').eq('status', 'available').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;
  },

  async completeLoad(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;
  },

  async cancelLoadAssignment(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
    if (error) throw error;
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase.from('loads').select('*').or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- Drivers ---
  async getAllDrivers() {
    const { data, error } = await supabase.from('driver_details').select('*, profiles(full_name, phone, email, avatar_url, license_url, truck_photo_url)');
    if (error) throw error;
    return data;
  },

  async getAllSubDrivers() {
    const { data, error } = await supabase.from('sub_drivers').select('*');
    if (error) throw error;
    return data;
  },

  // --- Notifications ---
  async sendNotification(userId: string, title: string, message: string) {
    await supabase.from('notifications').insert([{ user_id: userId, title, message }]);
  },

  async getNotifications(userId: string) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return data;
  },

  async markNotificationsAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  },

  // --- Stats ---
  async getShipperStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0 };
  },

  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 4.8 };
  }
};
