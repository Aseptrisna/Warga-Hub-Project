/**
 * Settings Seeder
 * Creates default application settings
 */

export const seedSettings = async (settingModel: any) => {
  console.log('🌱 Seeding settings...');

  const settings = [
    // General
    { key: 'app_name', value: 'WargaHub', category: 'general', description: 'Nama aplikasi', isEditable: true },
    { key: 'app_version', value: '1.0.0', category: 'general', description: 'Versi aplikasi saat ini', isEditable: false },
    { key: 'maintenance_mode', value: 'false', category: 'general', description: 'Mode maintenance (true/false)', isEditable: true },
    { key: 'default_language', value: 'id', category: 'general', description: 'Bahasa default aplikasi', isEditable: true },

    // Appearance
    { key: 'primary_color', value: '#4F46E5', category: 'appearance', description: 'Warna utama tema aplikasi', isEditable: true },
    { key: 'logo_url', value: '/favicon.svg', category: 'appearance', description: 'URL logo aplikasi', isEditable: true },

    // Notification
    { key: 'email_enabled', value: 'true', category: 'notification', description: 'Aktifkan notifikasi email', isEditable: true },
    { key: 'wa_enabled', value: 'false', category: 'notification', description: 'Aktifkan notifikasi WhatsApp', isEditable: true },

    // Security
    { key: 'max_login_attempts', value: '5', category: 'security', description: 'Maksimal percobaan login sebelum akun dikunci', isEditable: true },
    { key: 'session_timeout', value: '3600', category: 'security', description: 'Durasi sesi login dalam detik (default: 1 jam)', isEditable: true },
  ];

  let created = 0;
  for (const data of settings) {
    const existing = await settingModel.findOne({ key: data.key });
    if (!existing) {
      const doc = new settingModel(data);
      await doc.save();
      console.log(`✅ Created setting: ${data.key} = ${data.value}`);
      created++;
    } else {
      console.log(`⏭️  Setting already exists: ${data.key}`);
    }
  }

  console.log(`✅ Settings seeding completed! (${created} settings)\n`);
};
