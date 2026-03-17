/**
 * Comprehensive Citizens Seeder — 500 Warga
 * Generates realistic Indonesian family data programmatically
 */

// ============================
// Data Pools
// ============================
const NAMA_DEPAN_PRIA = [
  'Budi', 'Agus', 'Hendra', 'Joko', 'Ahmad', 'Dedi', 'Bambang', 'Eko', 'Firman', 'Gilang',
  'Hasan', 'Irwan', 'Kurnia', 'Lukman', 'Mulyadi', 'Nandi', 'Oki', 'Putra', 'Rudi', 'Surya',
  'Tono', 'Udin', 'Wahyu', 'Yanto', 'Zainal', 'Ari', 'Dadang', 'Fajar', 'Gunawan', 'Iwan',
  'Komarudin', 'Maman', 'Nanang', 'Rahmat', 'Slamet', 'Tatang', 'Ujang', 'Wawan', 'Yusuf', 'Asep',
  'Deni', 'Hendri', 'Iman', 'Jajang', 'Kiki', 'Luki', 'Mujib', 'Nana', 'Roni', 'Sandi',
  'Teguh', 'Usman', 'Viki', 'Widi', 'Yogi', 'Zaki', 'Adi', 'Cecep', 'Dadan', 'Endang',
];

const NAMA_DEPAN_WANITA = [
  'Siti', 'Dewi', 'Sri', 'Rina', 'Linda', 'Ani', 'Wati', 'Yanti', 'Neni', 'Tuti',
  'Ratna', 'Sari', 'Mega', 'Nia', 'Okta', 'Putri', 'Wulan', 'Fitri', 'Dian', 'Eka',
  'Lina', 'Mira', 'Nurul', 'Ira', 'Hana', 'Gita', 'Indah', 'Kartika', 'Maya', 'Reni',
  'Suci', 'Tari', 'Umi', 'Vera', 'Winda', 'Yuli', 'Zahra', 'Atik', 'Cucu', 'Euis',
  'Farida', 'Hetty', 'Ida', 'Jumiati', 'Lastri', 'Mulyani', 'Neneng', 'Pipit', 'Risma', 'Sulastri',
  'Titin', 'Utami', 'Wiwin', 'Yayah', 'Zulfa', 'Ayu', 'Bella', 'Cici', 'Dina', 'Elsa',
];

const NAMA_KELUARGA = [
  'Santoso', 'Wijaya', 'Setiawan', 'Susilo', 'Susanti', 'Suryanto', 'Kusuma', 'Pratama',
  'Hidayat', 'Ramadhan', 'Prasetyo', 'Kurniawan', 'Nugroho', 'Saputra', 'Hartono', 'Sutrisno',
  'Firmansyah', 'Gunawan', 'Supriatna', 'Maulana', 'Wibowo', 'Utomo', 'Cahyadi', 'Purnomo',
  'Hermawan', 'Budiman', 'Rahayu', 'Lestari', 'Handayani', 'Pramesti', 'Fitriani', 'Maharani',
  'Hasanudin', 'Kusnadi', 'Mulyadi', 'Permadi', 'Supardi', 'Sudirman', 'Wahyudi', 'Junaedi',
];

const PEKERJAAN = [
  'Guru PNS', 'Wiraswasta', 'Buruh Harian Lepas', 'Pegawai Swasta', 'Pedagang', 'Petani',
  'Nelayan', 'Montir', 'Tukang', 'Sopir', 'Perawat', 'Dokter', 'Apoteker', 'Satpam',
  'PNS', 'TNI/Polri', 'Pensiunan', 'Pegawai Bank', 'Penjahit', 'Karyawan Pabrik',
  'Guru Honorer', 'Ojol', 'Teknisi', 'Programmer', 'Akuntan',
];

const PEKERJAAN_IRT = 'Ibu Rumah Tangga';
const PEKERJAAN_PELAJAR = 'Pelajar';
const PEKERJAAN_BALITA = 'Belum/Tidak Bekerja';

const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const AGAMA_WEIGHTS = [0.80, 0.08, 0.04, 0.03, 0.03, 0.02];

const PENDIDIKAN_DEWASA = ['SD', 'SMP', 'SMA', 'D-1', 'D-3', 'S-1', 'S-2'];
const PENDIDIKAN_WEIGHTS = [0.10, 0.15, 0.35, 0.05, 0.10, 0.20, 0.05];

const GOL_DARAH = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const TEMPAT_LAHIR = [
  'Bandung', 'Jakarta', 'Surabaya', 'Semarang', 'Yogyakarta', 'Tasikmalaya',
  'Garut', 'Cirebon', 'Bogor', 'Bekasi', 'Depok', 'Surakarta', 'Malang',
  'Cianjur', 'Sukabumi', 'Subang', 'Karawang', 'Purwakarta',
];

const ALAMAT_JALAN = [
  'Jl. Merdeka', 'Jl. Sukamaju', 'Jl. Raya Baleendah', 'Jl. Kenanga', 'Jl. Flamboyan',
  'Jl. Cempaka', 'Jl. Dahlia', 'Jl. Melati', 'Jl. Bougenville', 'Jl. Teratai',
  'Jl. Mawar', 'Jl. Sakura', 'Jl. Anggrek', 'Gang Mawar', 'Gang Kenanga',
  'Gang Cempaka', 'Gang Melati', 'Jl. Pahlawan', 'Jl. Kartini', 'Jl. Diponegoro',
];

const STATUS_RUMAH = ['Milik Sendiri', 'Kontrak', 'Milik Sendiri', 'Milik Sendiri', 'Menumpang'];

// ============================
// Helper Functions
// ============================
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(arr: string[], weights: number[]): string {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < arr.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) return arr[i];
  }
  return arr[arr.length - 1];
}

function randomDate(yearStart: number, yearEnd: number): Date {
  const year = yearStart + Math.floor(Math.random() * (yearEnd - yearStart + 1));
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

function padNum(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

let nikCounter = 1;
let kkCounter = 1;

function generateNIK(rtNum: number, birthDate: Date, gender: string): string {
  const kab = '3273';
  const rt = padNum(rtNum, 2);
  const dd = gender === 'Perempuan'
    ? padNum(birthDate.getDate() + 40, 2)
    : padNum(birthDate.getDate(), 2);
  const mm = padNum(birthDate.getMonth() + 1, 2);
  const yy = String(birthDate.getFullYear()).slice(-2);
  const seq = padNum(nikCounter++, 4);
  return `${kab}${rt}${dd}${mm}${yy}${seq}`;
}

function generateKK(rtNum: number): string {
  const kab = '3273';
  const rt = padNum(rtNum, 2);
  const seq = padNum(kkCounter++, 8);
  return `${kab}${rt}${seq}`;
}

function getPendidikanByAge(age: number): string {
  if (age < 6) return 'Belum Sekolah';
  if (age < 7) return 'TK';
  if (age < 13) return 'SD';
  if (age < 16) return 'SMP';
  if (age < 19) return 'SMA';
  return weightedPick(PENDIDIKAN_DEWASA, PENDIDIKAN_WEIGHTS);
}

function getPekerjaanByAge(age: number, gender: string, isWife: boolean): string {
  if (age < 6) return PEKERJAAN_BALITA;
  if (age < 18) return PEKERJAAN_PELAJAR;
  if (isWife && Math.random() < 0.4) return PEKERJAAN_IRT;
  return pick(PEKERJAAN);
}

interface CitizenData {
  nik: string;
  noKk: string;
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: Date;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  statusPerkawinan: string;
  statusHubunganDalamKeluarga: string;
  namaAyah: string;
  namaIbu: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  noTelp?: string;
  email?: string;
  kewarganegaraan: string;
  golonganDarah: string;
  nomorAktaLahir: string;
  npwp?: string;
  statusKepemilikanRumah: string;
  statusKependudukan: string;
  isActive: boolean;
  keterangan?: string;
}

// ============================
// Family Generator
// ============================
function generateFamily(rtNum: number, rwNum: number): CitizenData[] {
  const rtStr = padNum(rtNum, 2);
  const rwStr = padNum(rwNum, 2);
  const familyName = pick(NAMA_KELUARGA);
  const noKk = generateKK(rtNum);
  const agama = weightedPick(AGAMA, AGAMA_WEIGHTS);
  const alamat = `${pick(ALAMAT_JALAN)} No. ${Math.floor(Math.random() * 200) + 1}`;
  const statusRumah = pick(STATUS_RUMAH);
  const tempatLahir = pick(TEMPAT_LAHIR);

  const common = {
    noKk,
    agama,
    alamat,
    rt: rtStr,
    rw: rwStr,
    desa: 'Desa Sukamaju',
    kecamatan: 'Baleendah',
    kabupaten: 'Bandung',
    provinsi: 'Jawa Barat',
    kodePos: '40375',
    kewarganegaraan: 'WNI',
    statusKepemilikanRumah: statusRumah,
    statusKependudukan: 'Aktif',
    isActive: true,
  };

  const members: CitizenData[] = [];

  // KK (husband)
  const husbandBirth = randomDate(1965, 1990);
  const husbandAge = new Date().getFullYear() - husbandBirth.getFullYear();
  const husbandFirst = pick(NAMA_DEPAN_PRIA);
  const husbandName = `${husbandFirst} ${familyName}`;
  const husbandNik = generateNIK(rtNum, husbandBirth, 'Laki-laki');

  members.push({
    ...common,
    nik: husbandNik,
    namaLengkap: husbandName,
    jenisKelamin: 'Laki-laki',
    tempatLahir: pick(TEMPAT_LAHIR),
    tanggalLahir: husbandBirth,
    pendidikan: getPendidikanByAge(husbandAge),
    pekerjaan: pick(PEKERJAAN),
    statusPerkawinan: 'Kawin',
    statusHubunganDalamKeluarga: 'Kepala Keluarga',
    namaAyah: `${pick(NAMA_DEPAN_PRIA)} ${familyName}`,
    namaIbu: `${pick(NAMA_DEPAN_WANITA)}`,
    noTelp: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    golonganDarah: pick(GOL_DARAH),
    nomorAktaLahir: `3273-LT-${padNum(husbandBirth.getDate(), 2)}${padNum(husbandBirth.getMonth() + 1, 2)}${husbandBirth.getFullYear()}-${padNum(nikCounter, 4)}`,
    npwp: husbandAge >= 25 && Math.random() < 0.5 ? `${padNum(Math.floor(Math.random() * 99), 2)}.${padNum(Math.floor(Math.random() * 999), 3)}.${padNum(Math.floor(Math.random() * 999), 3)}.${Math.floor(Math.random() * 9)}-${padNum(Math.floor(Math.random() * 999), 3)}.000` : undefined,
  });

  // Wife
  const wifeBirth = randomDate(husbandBirth.getFullYear() - 3, husbandBirth.getFullYear() + 5);
  const wifeAge = new Date().getFullYear() - wifeBirth.getFullYear();
  const wifeFirst = pick(NAMA_DEPAN_WANITA);
  const wifeName = `${wifeFirst} ${pick(NAMA_KELUARGA)}`;
  const wifeNik = generateNIK(rtNum, wifeBirth, 'Perempuan');

  members.push({
    ...common,
    nik: wifeNik,
    namaLengkap: wifeName,
    jenisKelamin: 'Perempuan',
    tempatLahir: pick(TEMPAT_LAHIR),
    tanggalLahir: wifeBirth,
    pendidikan: getPendidikanByAge(wifeAge),
    pekerjaan: getPekerjaanByAge(wifeAge, 'Perempuan', true),
    statusPerkawinan: 'Kawin',
    statusHubunganDalamKeluarga: 'Istri',
    namaAyah: `${pick(NAMA_DEPAN_PRIA)} ${pick(NAMA_KELUARGA)}`,
    namaIbu: `${pick(NAMA_DEPAN_WANITA)}`,
    noTelp: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    golonganDarah: pick(GOL_DARAH),
    nomorAktaLahir: `3273-LT-${padNum(wifeBirth.getDate(), 2)}${padNum(wifeBirth.getMonth() + 1, 2)}${wifeBirth.getFullYear()}-${padNum(nikCounter, 4)}`,
  });

  // Children (1-3)
  const numChildren = Math.floor(Math.random() * 3) + 1; // 1-3
  const youngestParentYear = Math.max(husbandBirth.getFullYear(), wifeBirth.getFullYear());
  const earliestChildYear = youngestParentYear + 20;
  for (let c = 0; c < numChildren; c++) {
    if (earliestChildYear > 2024) continue; // Parents too young
    const isGirl = Math.random() < 0.5;
    const childBirth = randomDate(earliestChildYear, 2024);
    const childAge = new Date().getFullYear() - childBirth.getFullYear();
    const childFirst = isGirl ? pick(NAMA_DEPAN_WANITA) : pick(NAMA_DEPAN_PRIA);
    const childName = `${childFirst} ${familyName}`;
    const childGender = isGirl ? 'Perempuan' : 'Laki-laki';
    const childNik = generateNIK(rtNum, childBirth, childGender);

    members.push({
      ...common,
      nik: childNik,
      namaLengkap: childName,
      jenisKelamin: childGender,
      tempatLahir,
      tanggalLahir: childBirth,
      pendidikan: getPendidikanByAge(childAge),
      pekerjaan: getPekerjaanByAge(childAge, childGender, false),
      statusPerkawinan: childAge >= 18 && Math.random() < 0.15 ? 'Kawin' : 'Belum Kawin',
      statusHubunganDalamKeluarga: 'Anak',
      namaAyah: husbandName,
      namaIbu: wifeName,
      noTelp: childAge >= 12 ? `08${Math.floor(1000000000 + Math.random() * 9000000000)}` : undefined,
      golonganDarah: pick(GOL_DARAH),
      nomorAktaLahir: `3273-LT-${padNum(childBirth.getDate(), 2)}${padNum(childBirth.getMonth() + 1, 2)}${childBirth.getFullYear()}-${padNum(nikCounter, 4)}`,
    });
  }

  return members;
}

// ============================
// Main Seeder
// ============================
export const seedCitizensComprehensive = async (citizenModel: any) => {
  console.log('🌱 Seeding comprehensive citizen data (500 warga)...');

  // Reset counters
  nikCounter = 1;
  kkCounter = 1;

  const allCitizens: CitizenData[] = [];
  const TARGET = 500;
  const TOTAL_RT = 12;
  const FAMILIES_PER_RT = 14; // ~14 families per RT * 12 RT = ~168 families, trimmed to 500

  // Generate families for each RT
  for (let rtIdx = 0; rtIdx < TOTAL_RT; rtIdx++) {
    const rtNum = rtIdx + 1;
    const rwNum = Math.floor(rtIdx / 3) + 1;

    for (let f = 0; f < FAMILIES_PER_RT; f++) {
      if (allCitizens.length >= TARGET) break;
      const family = generateFamily(rtNum, rwNum);
      allCitizens.push(...family);
    }
    if (allCitizens.length >= TARGET) break;
  }

  // Trim to exactly TARGET if over
  const citizens = allCitizens.slice(0, TARGET);

  // Batch insert for performance
  const BATCH_SIZE = 50;
  let created = 0;
  for (let i = 0; i < citizens.length; i += BATCH_SIZE) {
    const batch = citizens.slice(i, i + BATCH_SIZE);
    const ops = batch.map((c) => ({
      updateOne: {
        filter: { nik: c.nik },
        update: { $setOnInsert: c },
        upsert: true,
      },
    }));
    const result = await citizenModel.bulkWrite(ops);
    created += result.upsertedCount;
    console.log(`  📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${result.upsertedCount} citizens`);
  }

  // Count distribution
  const rtDistribution: Record<string, number> = {};
  const kkSet = new Set<string>();
  for (const c of citizens) {
    const key = `RW ${c.rw} / RT ${c.rt}`;
    rtDistribution[key] = (rtDistribution[key] || 0) + 1;
    kkSet.add(c.noKk);
  }

  console.log('✅ Comprehensive citizens seeding completed!');
  console.log(`📊 Total: ${created} warga dari ${kkSet.size} keluarga`);
  console.log('📍 Distribusi per RT:');
  Object.entries(rtDistribution).forEach(([key, count]) => {
    console.log(`   ${key}: ${count} warga`);
  });
  console.log('');
};
