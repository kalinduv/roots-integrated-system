const Student = require('../models/studentModel');
const { sendWelcomeEmail } = require('../utils/emailService'); // Used by manual email endpoint only

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Create a new student

exports.createStudent = async (req, res) => {
  try {
    const student = await Student.createStudent(req.body);
    // Welcome email is NOT sent automatically on registration.
    // Use the manual email button in the dashboard to send it when needed.
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.getStudentById(req.params.id);
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.updateStudent(req.params.id, req.body);
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const result = await Student.deleteStudent(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendManualWelcomeEmail = async (req, res) => {
  console.log(`Manual email request received for student docId: ${req.params.id}`);
  try {
    const student = await Student.getStudentById(req.params.id);
    if (!student || !student.email) {
      console.log('Student or email not found for manual trigger');
      return res.status(404).json({ error: 'Student or email not found' });
    }

    console.log(`Attempting to send manual email to: ${student.email}`);
    const result = await sendWelcomeEmail(
      student.email, 
      student.name, 
      student.courseDetails || 'Course not specified'
    );

    if (result.success) {
      console.log('Manual email sent successfully');
      res.status(200).json({ message: 'Welcome email sent successfully' });
    } else {
      console.log(`Failed to send manual email: ${result.error}`);
      res.status(500).json({ error: result.error || 'Failed to send email' });
    }
  } catch (error) {
    console.error('Crash in sendManualWelcomeEmail:', error);
    res.status(500).json({ error: error.message });
  }
};