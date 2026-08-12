const router = require("express").Router();
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const { auth, requireRole } = require("../middleware/auth");

//
// CREATE QUIZ (Teacher/Admin)
//
router.post(
  "/quiz",
  auth(),
  requireRole("teacher", "admin"),
  async (req, res) => {
    try {
      const { course, questions } = req.body;

      if (!course)
        return res.status(400).json({ message: "Course is required" });

      if (!questions || questions.length === 0)
        return res.status(400).json({ message: "Questions are required" });

      let quiz = await Quiz.findOne({ course });

      if (quiz) {
        quiz.questions = questions;
        quiz.createdBy = req.user._id;
        await quiz.save();
      } else {
        quiz = await Quiz.create({
          course,
          questions,
          createdBy: req.user._id,
        });
      }

      res.json({
        message: "Quiz saved successfully",
        quiz,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Failed to save quiz",
      });
    }
  }
);

//
// GET QUIZ BY COURSE
//
router.get(
  "/quiz/course/:courseId",
  auth(),
  async (req, res) => {
    try {
      const quiz = await Quiz.findOne({
        course: req.params.courseId,
      });

      if (!quiz)
        return res.status(404).json({
          message: "Quiz not found",
        });

      res.json(quiz);
    }  catch (err) {

  console.error("QUIZ SUBMIT ERROR:");
  console.error(err);

  res.status(500).json({
    message: err.message
  });

}
}
);
//
// SUBMIT QUIZ
//
router.post(
  "/quiz/submit",
  auth(),
  requireRole("student"),
  async (req, res) => {

    try {

      const { course, answers } = req.body;

      const quiz = await Quiz.findOne({ course });

      if (!quiz)
        return res.status(404).json({
          message: "Quiz not found"
        });

     // Count previous attempts (for record only)
const previousAttempts = await QuizAttempt.countDocuments({
  student: req.user._id,
  course
});
      let correct = 0;

      const answerSheet = [];

      quiz.questions.forEach((q, i) => {

        const selected = answers[i];

        const ok = selected === q.answer;

        if (ok) correct++;

        answerSheet.push({
          question: q.question,
          selectedAnswer: selected,
          correctAnswer: q.answer,
          isCorrect: ok
        });

      });

      const percentage =
        (correct / quiz.questions.length) * 100;

      let grade = "F";
      let passed = false;

      if (percentage >= 90) {
        grade = "A+";
        passed = true;
      }
      else if (percentage >= 80) {
        grade = "A";
        passed = true;
      }
      else if (percentage >= 70) {
        grade = "B+";
        passed = true;
      }
      else if (percentage >= 60) {
        grade = "B";
        passed = true;
      }

      await QuizAttempt.create({
        

        student: req.user._id,

        course,

        score: correct,

        percentage,

        grade,

        passed,

        attempt: previousAttempts + 1,

        answers: answerSheet

      });
      if (passed) {

  const Enrollment = require("../models/Enrollment");
  const Certificate = require("../models/Certificate");
  const Course = require("../models/Course");

  // Mark course completed
  await Enrollment.findOneAndUpdate(
    {
      student: req.user._id,
      course
    },
    {
      status: "completed",
      completedAt: new Date()
    }
  );

  // Get course details
const courseDoc = await Course.findById(course);

if (!courseDoc) {
  return res.status(404).json({
    message: "Course not found"
  });
}

// Find existing certificate
const existing = await Certificate.findOne({
  student: req.user._id,
  course
});

// Certificate data from the LATEST PASSED quiz
const certificateData = {
  student: req.user._id,

  studentName: req.user.name,

  course,

  courseName: courseDoc.title,

  // Keep the same certificate ID if one already exists
  certificateId:
    existing?.certificateId || "CERT-" + Date.now(),

  // Latest quiz grade
  grade,

  completionDate: new Date(),

  issueDate: new Date(),

  template:
    grade === "A+" || grade === "A"
      ? "excellence"
      : grade === "B+" || grade === "B"
      ? "achievement"
      : "standard"
};

// Update existing certificate
if (existing) {

  await Certificate.findByIdAndUpdate(
    existing._id,
    certificateData,
    { new: true }
  );

} else {

  // Create certificate if it doesn't exist
  await Certificate.create(certificateData);

}

}

      res.json({

  completed: passed,

  score: correct,

  percentage,

  grade,

  passed,

  attemptsLeft: null,

  message: passed
    ? "Congratulations! You passed."
    : "Quiz failed."

});

    } catch (err) {

  console.error("QUIZ ERROR:", err);

  res.status(500).json({
    message: err.message,
    error: err
  });

}

  }
);
router.get(
  "/quiz",
  auth(),
  requireRole("teacher", "admin"),
  async (req, res) => {

    try {

      const quizzes = await Quiz.find()
        .populate("course", "title")
        .sort({ createdAt: -1 });

      res.json(quizzes);

    } catch (err) {

      res.status(500).json({
        message: "Failed to load quizzes"
      });

    }

  }
);
router.delete(
  "/quiz/:id",
  auth(),
  requireRole("teacher", "admin"),
  async (req, res) => {

    try {

      await Quiz.findByIdAndDelete(req.params.id);

      res.json({
        message: "Quiz deleted successfully"
      });

    } catch (err) {

      res.status(500).json({
        message: "Delete failed"
      });

    }

  }
);
//
// TEACHER - VIEW QUIZ RESULTS
//
router.get(
  "/quiz/results",
  auth(),
  requireRole("teacher", "admin"),
  async (req, res) => {

    try {

      const results = await QuizAttempt.find()

        .populate("student", "name email")

        .populate("course", "title")

        .sort({ createdAt: -1 });

      res.json(results);

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: "Failed to load results"
      });

    }

  }
);
module.exports = router;