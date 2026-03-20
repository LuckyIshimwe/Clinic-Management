const Student = require("../models/Student");
const csv = require('csv-parser');
const { Readable } = require('stream');


const DEFAULT_SCHOOL_ID = "SCHOOL001";

const registerStudent = async (req, res) => {
  try {
    console.log("=== REGISTRATION REQUEST START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Authenticated user:", req.user);
    
    const {
      fullName,
      studentId,
      grade,
      section,
      age,
      gender,
      familyName,
      bloodGroup,
      parentContact,
      allergies,
      chronicConditions,
      currentMedications,
      status
    } = req.body;

   
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    if (!fullName || !studentId || !grade || !age || !gender || !familyName) {
      console.log("Missing required fields");
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields",
        received: { fullName, studentId, grade, age, gender, familyName }
      });
    }

    console.log("Checking for existing student with ID:", studentId, "in school:", schoolId);
    const existingStudent = await Student.findOne({ studentId, schoolId });
    
    if (existingStudent) {
      console.log("Student already exists:", existingStudent);
      return res.status(400).json({ 
        success: false,
        message: "Student ID already exists in your school" 
      });
    }

    const studentData = {
      fullName,
      studentId,
      grade,
      section,
      age: parseInt(age),
      gender,
      familyName,
      bloodGroup: bloodGroup || "Unknown",
      parentContact,
      allergies: allergies || "",
      chronicConditions: chronicConditions || "",
      currentMedications: currentMedications || "",
      status: status || "Active",
      schoolId,
      registeredBy: req.user._id
    };

    console.log("Attempting to create student with data:", JSON.stringify(studentData, null, 2));

    const student = await Student.create(studentData);

    console.log("Student created successfully:", student);
    console.log("=== REGISTRATION REQUEST END ===");

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student
    });
    
  } catch (error) {
    console.error("=== ERROR DURING REGISTRATION ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: "Validation error",
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Student with this ID already exists"
      });
    }

    res.status(500).json({ 
      success: false,
      message: error.message,
      errorType: error.name
    });
  }
};

const getStudents = async (req, res) => {
  try {
    console.log("Fetching students...");
    
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;

    const students = await Student.find({
      schoolId,
      status: "Active",
    }).sort({ grade: 1, familyName: 1, fullName: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getStudent = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const student = await Student.findOne({
      studentId: req.params.studentId,
      schoolId
    });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const student = await Student.findOneAndUpdate(
      { 
        studentId: req.params.studentId,
        schoolId
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const student = await Student.findOneAndUpdate(
      { 
        studentId: req.params.studentId,
        schoolId
      },
      { status: "Inactive" },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deactivated successfully"
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};



const bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const students = [];
    const errors = [];

   
    const bufferStream = Readable.from(req.file.buffer.toString('utf-8').split('\n'));

    bufferStream
      .pipe(csv())
      .on('data', (row) => {
        try {
          if (!row.studentId || !row.fullName || !row.grade || !row.age || !row.gender || !row.familyName) {
            errors.push({ row, error: "Missing required fields" });
            return;
          }

          students.push({
            fullName: row.fullName,
            studentId: row.studentId,
            grade: row.grade,
            section: row.section || '',
            age: parseInt(row.age),
            gender: row.gender,
            familyName: row.familyName,
            bloodGroup: row.bloodGroup || 'Unknown',
            parentContact: {
              fatherName: row.fatherName || '',
              fatherPhone: row.fatherPhone || '',
              motherName: row.motherName || '',
              motherPhone: row.motherPhone || '',
              emergencyPhone: row.emergencyPhone || ''
            },
            allergies: row.allergies || '',
            chronicConditions: row.chronicConditions || '',
            currentMedications: row.currentMedications || '',
            status: "Active",
            schoolId,
            registeredBy: req.user._id
          });
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      })
      .on('end', async () => {
        try {
          const result = await Student.insertMany(students, { ordered: false });

          

          res.status(201).json({
            success: true,
            message: `Successfully imported ${result.length} students`,
            imported: result.length,
            errors: errors.length,
            errorDetails: errors
          });
        } catch (error) {
          console.error("Error bulk importing students:", error);
          res.status(500).json({ 
            success: false,
            message: "Error importing students", 
            error: error.message,
            errors: errors
          });
        }
      });
  } catch (error) {
    console.error("Error in bulk import:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  registerStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
};