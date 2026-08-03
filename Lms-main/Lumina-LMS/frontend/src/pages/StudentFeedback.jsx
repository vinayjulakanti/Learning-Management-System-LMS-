import React, { useEffect, useState } from "react";
import { FeedbackAPI } from "../api/client";

export default function StudentFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    try {
      const { data } = await FeedbackAPI.list();
      setFeedbacks(data.feedbacks || []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }

  const todayCount = feedbacks.filter(
    (f) =>
      new Date(f.createdAt).toDateString() ===
      new Date().toDateString()
  ).length;

  const avgRating =
    feedbacks.length === 0
      ? 0
      : (
          feedbacks.reduce((a, b) => a + (b.rating || 5), 0) /
          feedbacks.length
        ).toFixed(1);

  return (
    <div
      style={{
        padding: 30,
        background: "#f4f7fb",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          marginBottom: 30,
          fontWeight: "bold",
        }}
      >
        🎓 Student Feedback Dashboard
      </h1>

      {/* Cards */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 15,
            padding: 20,
            boxShadow: "0 8px 20px rgba(0,0,0,.08)",
          }}
        >
          <h4>Total Feedback</h4>
          <h1 style={{ color: "#2563eb" }}>{feedbacks.length}</h1>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 15,
            padding: 20,
            boxShadow: "0 8px 20px rgba(0,0,0,.08)",
          }}
        >
          <h4>Average Rating</h4>
          <h1 style={{ color: "#f59e0b" }}>⭐ {avgRating}</h1>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 15,
            padding: 20,
            boxShadow: "0 8px 20px rgba(0,0,0,.08)",
          }}
        >
          <h4>Today's Feedback</h4>
          <h1 style={{ color: "#10b981" }}>{todayCount}</h1>
        </div>
      </div>

      {/* Search */}

      <input
        placeholder="🔍 Search Student..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 15,
          borderRadius: 10,
          border: "1px solid #ddd",
          marginBottom: 30,
          fontSize: 16,
        }}
      />

      {loading ? (
        <h2>Loading...</h2>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(350px,1fr))",
            gap: 25,
          }}
        >
          {feedbacks
            .filter((f) =>
              (f.student?.name || "")
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .map((f) => (
              <div
                key={f._id}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: "0 8px 25px rgba(0,0,0,.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "#2563eb",
                      color: "#fff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 24,
                      fontWeight: "bold",
                    }}
                  >
                    {(f.student?.name || "S").charAt(0)}
                  </div>

                  <div style={{ marginLeft: 15 }}>
                    <h3 style={{ margin: 0 }}>
                      {f.student?.name}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                      }}
                    >
                      {f.student?.rollNo}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: 15,
                    borderRadius: 10,
                    minHeight: 100,
                  }}
                >
                  {f.message}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 20,
                  }}
                >
                  <span
                    style={{
                      color: "#f59e0b",
                      fontWeight: "bold",
                    }}
                  >
                    {"⭐".repeat(f.rating || 5)}
                  </span>

                  <span
                    style={{
                      color: "#64748b",
                    }}
                  >
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}