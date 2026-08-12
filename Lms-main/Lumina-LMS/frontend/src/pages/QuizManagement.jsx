import React, { useState, useEffect } from "react";
import { CoursesAPI, QuizAPI } from "../api/client";

export default function QuizManagement() {

  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [course, setCourse] = useState("");

  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      answer: 0
    }
  ]);
  useEffect(() => {

  loadCourses();

  loadQuizzes();

}, []);

 

async function loadCourses() {
  try {
    const response = await CoursesAPI.list();

    console.log("FULL RESPONSE:", response);
    console.log("DATA:", response.data);
    console.log("COURSES:", response.data.courses);

    setCourses(response.data.courses || []);

  } catch (err) {
    console.log("ERROR:", err.response);
    setCourses([]);
  }
}
async function loadQuizzes() {

  try {

    const res = await QuizAPI.list();

    setQuizzes(res.data);

  } catch (err) {

    console.log(err);

  }

}
  const addQuestion = () => {

    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        answer: 0
      }
    ]);
    

  };

  async function saveQuiz() {

  try {

    await QuizAPI.create({

      course,

      questions

    });

    alert("Quiz Saved Successfully");

    // Reset selected course
    setCourse("");

    // Clear questions
    setQuestions([
      {
        question: "",
        options: ["", "", "", ""],
        answer: 0
      }
    ]);

    // Refresh quiz list
    loadQuizzes();

  } catch (err) {

  console.log(err.response);

  console.log(err.response?.data);

  alert(err.response?.data?.message || "Failed to save quiz");

}
  }

async function deleteQuiz(id) {

  if (!window.confirm("Delete this quiz?"))
    return;

  await QuizAPI.delete(id);

  loadQuizzes();

}

  return (

    <div className="container">

      <h2>📝 Quiz Management</h2>

      <select
        value={course}
        onChange={(e) => setCourse(e.target.value)}
      >

        <option value="">Select Course</option>

        {Array.isArray(courses) &&
  courses.map((c) => (

          <option
            key={c._id}
            value={c._id}
          >
            {c.title}
          </option>

        ))}

      </select>

      <br />
      <br />

      {questions.map((q, i) => (

        <div
          key={i}
          className="card"
          style={{
            padding:20,
            marginBottom:20
          }}
        >

          <h3>
            Question {i + 1}
          </h3>

          <input
            placeholder="Question"
            value={q.question}
            onChange={(e)=>{

              const arr=[...questions];

              arr[i].question=e.target.value;

              setQuestions(arr);

            }}
          />

          <br/><br/>

          {q.options.map((op,j)=>(

            <input
              key={j}
              placeholder={`Option ${j+1}`}
              value={op}
              onChange={(e)=>{

                const arr=[...questions];

                arr[i].options[j]=e.target.value;

                setQuestions(arr);

              }}
            />

          ))}

          <br/><br/>

          <label>

            Correct Answer

          </label>

          <select
            value={q.answer}
            onChange={(e)=>{

              const arr=[...questions];

              arr[i].answer=Number(e.target.value);

              setQuestions(arr);

            }}
          >

            <option value={0}>Option 1</option>
            <option value={1}>Option 2</option>
            <option value={2}>Option 3</option>
            <option value={3}>Option 4</option>

          </select>

        </div>

      ))}

      <button onClick={addQuestion}>

        ➕ Add Question

      </button>

      <button
        onClick={saveQuiz}
        style={{
          marginLeft:15
        }}
      >

        💾 Save Quiz

      </button>
      <hr />
      

<h2>Saved Quizzes</h2>

<table style={{ width: "100%" }}>

  <thead>

    <tr>

      <th>Course</th>

      <th>Questions</th>

      <th>Action</th>

    </tr>

  </thead>

  <tbody>

    {quizzes.map((quiz) => (

      <tr key={quiz._id}>

        <td>{quiz.course?.title}</td>

        <td>{quiz.questions.length}</td>

        <td>

          <button
            onClick={() => deleteQuiz(quiz._id)}
          >
            🗑 Delete
          </button>

        </td>

      </tr>

    ))}

  </tbody>

</table>

    </div>

  );

}