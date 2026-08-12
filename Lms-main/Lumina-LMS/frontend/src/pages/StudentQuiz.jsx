import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QuizAPI } from "../api/client";

export default function StudentQuiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    loadQuiz();
  }, [courseId]);

  async function loadQuiz() {
    try {
      const res = await QuizAPI.getCourseQuiz(courseId);

      setQuiz(res.data);

      setAnswers(
        new Array(res.data.questions.length).fill(-1)
      );
    } catch (err) {
      console.error("QUIZ LOAD ERROR:", err);

      alert(
        err.response?.data?.message ||
        "Failed to load quiz"
      );
    }
  }

  function chooseAnswer(questionIndex, optionIndex) {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[questionIndex] = optionIndex;
      return updated;
    });
  }

  async function submitQuiz() {
    try {
      const res = await QuizAPI.submit({
        course: courseId,
        answers
      });

      alert(
        `${res.data.message}\n\n` +
        `Score: ${res.data.score}/${quiz.questions.length}\n` +
        `Percentage: ${res.data.percentage}%\n` +
        `Grade: ${res.data.grade}`
      );

      navigate("/dashboard");

    } catch (err) {
      console.error("QUIZ SUBMIT ERROR:", err);

      alert(
        err.response?.data?.message ||
        "Quiz submission failed"
      );
    }
  }

  if (!quiz) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f7fb"
        }}
      >
        <div
          style={{
            background: "white",
            padding: "35px 50px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            fontSize: "18px",
            fontWeight: "600"
          }}
        >
          Loading Quiz...
        </div>
      </div>
    );
  }

  const answeredCount = answers.filter(
    (answer) => answer !== -1
  ).length;

  const totalQuestions = quiz.questions.length;

  const progress =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f5f7fb 0%, #eef2ff 100%)",
        padding: "45px 20px"
      }}
    >

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto"
        }}
      >

        {/* Header */}
        <div
          style={{
            marginBottom: "25px"
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}
          >

            <div>
              <div
                style={{
                  color: "#2563eb",
                  fontSize: "14px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "6px"
                }}
              >
                Assessment
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "34px",
                  color: "#172033"
                }}
              >
                Quiz
              </h1>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "10px 16px",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                fontWeight: "700",
                color: "#374151"
              }}
            >
              {answeredCount} / {totalQuestions}
            </div>

          </div>

          {/* Progress bar */}
          <div
            style={{
              height: "8px",
              background: "#dbe4f5",
              borderRadius: "20px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #2563eb, #7c3aed)",
                borderRadius: "20px",
                transition: "width 0.3s ease"
              }}
            />
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "13px",
              color: "#64748b"
            }}
          >
            {progress}% completed
          </div>

        </div>

        {/* Questions */}
        {quiz.questions.map((q, i) => (

          <div
            key={i}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "30px",
              marginBottom: "22px",
              boxShadow:
                "0 8px 30px rgba(30, 41, 59, 0.08)",
              border: "1px solid #e5e7eb"
            }}
          >

            {/* Question number */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "15px",
                marginBottom: "25px"
              }}
            >

              <div
                style={{
                  minWidth: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "17px"
                }}
              >
                {i + 1}
              </div>

              <h2
                style={{
                  margin: "5px 0 0",
                  fontSize: "21px",
                  lineHeight: "1.5",
                  color: "#172033"
                }}
              >
                {q.question}
              </h2>

            </div>

            {/* Options */}
            <div
              style={{
                display: "grid",
                gap: "12px"
              }}
            >

              {q.options.map((op, j) => {

                const selected = answers[i] === j;

                return (
                  <label
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      padding: "16px 18px",
                      borderRadius: "14px",

                      border: selected
                        ? "2px solid #2563eb"
                        : "2px solid #e5e7eb",

                      background: selected
                        ? "#eff6ff"
                        : "#ffffff",

                      cursor: "pointer",

                      transition:
                        "all 0.2s ease",

                      boxShadow: selected
                        ? "0 4px 14px rgba(37,99,235,0.12)"
                        : "none"
                    }}
                  >

                    {/* Custom radio */}
                    <input
  type="radio"
  name={`question-${i}`}
  value={j}
  checked={selected}
  onChange={() => chooseAnswer(i, j)}
  style={{
    width: "22px",
    height: "22px",
    minWidth: "22px",
    margin: 0,
    cursor: "pointer",
    accentColor: "#2563eb"
  }}
/>

                    {/* Option letter */}
                    <span
                      style={{
                        width: "30px",
                        height: "30px",
                        minWidth: "30px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: selected
                          ? "#dbeafe"
                          : "#f1f5f9",
                        color: selected
                          ? "#2563eb"
                          : "#64748b",
                        fontWeight: "800",
                        fontSize: "13px"
                      }}
                    >
                      {String.fromCharCode(65 + j)}
                    </span>

                    {/* Answer */}
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#1e293b",
                        fontWeight: selected
                          ? "600"
                          : "500",
                        lineHeight: "1.5"
                      }}
                    >
                      {op}
                    </span>

                  </label>
                );
              })}

            </div>

          </div>

        ))}

        {/* Submit section */}
        <div
          style={{
            background: "#ffffff",
            padding: "22px 25px",
            borderRadius: "18px",
            boxShadow:
              "0 8px 25px rgba(30,41,59,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginTop: "10px"
          }}
        >

          <div>
            <div
              style={{
                fontWeight: "700",
                color: "#172033",
                marginBottom: "4px"
              }}
            >
              Ready to submit?
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#64748b"
              }}
            >
              {answeredCount === totalQuestions
                ? "All questions answered."
                : `Answer ${
                    totalQuestions - answeredCount
                  } more question(s).`}
            </div>
          </div>

          <button
            onClick={submitQuiz}
            disabled={answeredCount !== totalQuestions}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: "700",
              color: "white",
              cursor:
                answeredCount === totalQuestions
                  ? "pointer"
                  : "not-allowed",

              background:
                answeredCount === totalQuestions
                  ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                  : "#cbd5e1",

              boxShadow:
                answeredCount === totalQuestions
                  ? "0 6px 18px rgba(37,99,235,0.25)"
                  : "none",

              transition: "all 0.2s ease"
            }}
          >
            Submit Quiz →
          </button>

        </div>

      </div>
    </div>
  );
}