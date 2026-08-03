const router = require("express").Router();

const Feedback = require("../models/Feedback");

const { auth, requireRole } = require("../middleware/auth");


// Student submits feedback
router.post("/feedback", auth(), requireRole("student"), async (req, res) => {

  const feedback = await Feedback.create({
    student: req.user._id,
    message: req.body.message,
  });

  res.json(feedback);

});
// Student feedback history
router.get(
  "/feedback/me",
  auth(),
  requireRole("student"),
  async (req, res) => {

    const feedbacks = await Feedback.find({
      student: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ feedbacks });

  }
);

// Teacher views all feedback
router.get("/feedback", auth(), requireRole("teacher","admin"), async (req,res)=>{

  const feedbacks = await Feedback.find()
    .populate("student","name email rollNo")
    .sort({createdAt:-1});

  res.json({feedbacks});

});


module.exports = router;