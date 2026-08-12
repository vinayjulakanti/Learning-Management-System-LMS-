import React, { useEffect, useState } from "react";
import { CertificatesAPI } from "../api/client";
const certificateTemplate = `/certificate-template.png?v=${Date.now()}`;

export default function Certificate() {

  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    loadCertificate();
  }, []);

 async function loadCertificate() {
  try {
    const res = await CertificatesAPI.list();

    const certificates = res.data.certificates || [];

    if (certificates.length > 0) {

      // Sort certificates by issue date.
      // Newest certificate will be first.
      const sortedCertificates = [...certificates].sort(
        (a, b) =>
          new Date(b.issueDate || b.createdAt) -
          new Date(a.issueDate || a.createdAt)
      );

      // Show the newest certificate
      setCertificate(sortedCertificates[0]);
    } else {
      setCertificate(null);
    }

  } catch (err) {
    console.error("Certificate loading error:", err);
  }
}

  if (!certificate)
    return <h2 style={{ textAlign: "center" }}>No Certificate Found</h2>;

  return (
  <div
    style={{
      width: "1200px",
      height: "850px",
      margin: "20px auto",
      backgroundImage: `url(${certificateTemplate})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
    }}
  >

      {/* Student Name */}

      <h1
        style={{
          position: "absolute",
          top: "340px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#1e40af",
          fontSize: "52px",
          fontWeight: "bold"
        }}
      >
        {certificate.studentName}
      </h1>

      {/* Course Name */}

      <h2
        style={{
          position: "absolute",
          top: "500px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "34px"
        }}
      >
        {certificate.courseName}
      </h2>

      {/* Grade */}

      <h2
        style={{
          position: "absolute",
          top: "570px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#2563eb"
        }}
      >
        Grade : {certificate.grade}
      </h2>

      {/* Certificate ID */}

      <p
        style={{
          position: "absolute",
          bottom: "70px",
          left: "170px",
          fontWeight: "bold"
        }}
      >
        ID : {certificate.certificateId}
      </p>

      {/* Date */}

      <p
        style={{
          position: "absolute",
          bottom: "70px",
          right: "170px",
          fontWeight: "bold"
        }}
      >
        {new Date(certificate.issueDate).toLocaleDateString()}
      </p>

    </div>
  );

}