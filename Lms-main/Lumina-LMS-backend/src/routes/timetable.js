const router = require("express").Router();

const Timetable = require("../models/Timetable");

const { auth, requireRole } = require("../middleware/auth");
// Teacher Save / Update Timetable
router.post(
  "/timetable",
  auth(),
  requireRole("teacher", "admin"),
  async (req, res) => {
    try {
      const data = req.body;

      const timetable = await Timetable.findOneAndUpdate(
        {
          course: data.course,
          day: data.day,
        },
        data,
        {
          new: true,
          upsert: true,
        }
      );

      res.json(timetable);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Failed to save timetable",
      });
    }
  }
);
// Student View Timetable
router.get(
  "/timetable/:courseId",
  auth(),
  async (req, res) => {
    try {
      const timetable = await Timetable.find({
        course: req.params.courseId,
      }).sort({
        day: 1,
        startTime: 1,
      });

      res.json({
        timetable,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Failed to load timetable",
      });
    }
  }
);
// Delete timetable
router.delete(
  "/timetable/:id",
  auth(),
  requireRole("teacher", "admin"),
  async (req, res) => {
    try {
      await Timetable.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Delete failed",
      });
    }
  }
);
// Student timetable
router.get(
  "/me/timetable",
  auth(),
  async (req, res) => {

    console.log("========== ME TIMETABLE ==========");
    console.log("Student:", req.user._id);

    try {
      const Enrollment = require("../models/Enrollment");

      const enrollments = await Enrollment.find({
        student: req.user._id,
      });

      console.log("Enrollments:", enrollments);

      const courseIds = enrollments.map(e => e.course);

      console.log("Course IDs:", courseIds);

      const timetable = await Timetable.find({
        course: { $in: courseIds }
      })
      .populate("course", "title")
      .sort({
        day: 1,
        startTime: 1,
      });

      console.log("Timetable:", timetable);

      res.json({
        timetable,
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Failed to load timetable",
      });
    }
  }
);
module.exports = router;