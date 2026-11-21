import { useState } from "react";

function ResumeUpload() {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="upload-box">
      <div className="upload-icon">📄</div>

      <h3>Upload Your Resume</h3>

      <p>
        Upload your resume in PDF or DOCX format
      </p>

      <label className="upload-button">
        Choose Resume
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
        />
      </label>

      {file && (
        <div className="selected-file">
          ✓ {file.name}
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
