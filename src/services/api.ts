// src/services/api.ts (جزء من الملف)

// ... (الدوال السابقة مثل registerUser, verifyEmailOtp, loginByEmail تبقى كما هي)

  // ==========================================
  // Loads (تعديل استعلامات الشحنات)
  // ==========================================
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId, origin: loadData.origin, destination: loadData.destination,
      weight: parseFloat(loadData.weight) || 0, price: parseFloat(loadData.price) || 0,
      truck_size: loadData.truck_size, body_type: loadData.body_type,
      description: loadData.description || '', type: loadData.type || 'general',
      package_type: loadData.package_type, pickup_date: loadData.pickup_date,
      receiver_name: loadData.receiver_name, receiver_phone: loadData.receiver_phone,
      receiver_address: loadData.receiver_address, status: 'available',
    }]);
    if (error) throw error;
  },

  // هذا التعديل سيظهر اسم الشاحن للسائق
  async getAvailableLoads() {
    // نستخدم profiles:owner_id لربط الجدول بناءً على owner_id
    const { data, error } = await supabase
      .from('loads')
      .select('*, profiles:owner_id(full_name, phone, avatar_url)') 
      .eq('status', 'available')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  async getLoadById(id: string) {
    const { data, error } = await supabase
      .from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .or(`owner_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

// ... (الدوال الأخرى acceptLoad, updateLoadStatus, cancelLoad, submitBid, getLoadBids, etc تبقى كما هي)

  // ==========================================
  // Admin (تعديل استعلامات الأدمن)
  // ==========================================
  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: drivers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'driver');
    const { count: shippers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'shipper');
    const { count: activeLoads } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');

    return {
      totalUsers: users || 0,
      totalDrivers: drivers || 0,
      totalShippers: shippers || 0,
      activeLoads: activeLoads || 0,
      completedTrips: completed || 0,
    };
  },

  // تعديل لجلب الأدوار مع المستخدمين
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)') // هنا نجلب الدور من جدول user_roles
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // تعديل لجلب اسم صاحب الشحنة في لوحة الأدمن
  async getAllLoads() {
    const { data, error } = await supabase
      .from('loads')
      .select('*, profiles:owner_id(full_name)') // نجلب اسم المالك
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // تعديل لجلب اسم صاحب التذكرة
  async getTickets() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, profiles:user_id(full_name, email)') // نجلب بيانات المستخدم
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

// ... باقي الملف
