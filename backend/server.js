require('dotenv').config();
const express = require('express');
const cors = require('cors');

const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const pendingPaymentRoutes = require('./routes/pendingPaymentRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const resultRoutes = require('./routes/resultRoutes');

const staffController = require('./controllers/staffController');
const teacherController = require('./controllers/teacherController');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Roots Institute integrated backend running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pending-payments', pendingPaymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultRoutes);

app.get('/api/staff', staffController.getAllStaff);
app.post('/api/staff', staffController.createStaff);
app.get('/api/staff/:id', staffController.getStaffById);
app.put('/api/staff/:id', staffController.updateStaff);
app.delete('/api/staff/:id', staffController.deleteStaff);

app.get('/api/teachers', teacherController.getAllTeachers);
app.post('/api/teachers', teacherController.createTeacher);
app.get('/api/teachers/:id', teacherController.getTeacherById);
app.put('/api/teachers/:id', teacherController.updateTeacher);
app.delete('/api/teachers/:id', teacherController.deleteTeacher);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});