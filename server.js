// === ملف server.js الكامل والجاهز للرفع ===
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// 1. الاتصال بقاعدة البيانات
// الرابط ده هيتغير تلقائي لما نرفعه على Render ونحط الـ Environment Variables
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://AHMED_1_1:mongoahmed07141252007$@cluster0.iumso0y.mongodb.net/dark-store?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "ahmed_secret_key_2026";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ متصل بقاعدة بيانات MongoDB بنجاح'))
  .catch(err => console.error('❌ فشل الاتصال بقاعدة البيانات:', err));

// 2. تصميم الجداول (Models)
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
});

const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  packageName: String,
  price: Number,
  status: { type: String, default: 'قيد المراجعة' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);

// 3. المسارات (API Endpoints)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'الإيميل مسجل بالفعل أو حدث خطأ' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'بيانات الدخول غير صحيحة' });
  }
  const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET);
  res.json({ token, role: user.role, username: user.username });
});

app.post('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مصرح لك' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const { packageName, price } = req.body;
    const newOrder = new Order({ userId: decoded.id, username: decoded.username, packageName, price });
    await newOrder.save();
    res.status(201).json({ message: 'تم إرسال طلبك بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء عمل الطلب' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'صلاحيات غير كافية' });
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { res.status(500).json({ error: 'غير مصرح لك' }); }
});

app.put('/api/admin/orders/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'صلاحيات غير كافية' });
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
  } catch (error) { res.status(500).json({ error: 'خطأ في التحديث' }); }
});

// ملف التكوين لتشغيل السيرفر تلقائياً على Render
const packageJson = {
  "name": "dark-store-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.19.2",
    "mongoose": "^8.3.1",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 السيرفر شغال بنجاح على بورت ${PORT}`));
      
