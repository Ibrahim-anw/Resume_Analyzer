import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Results from "./components/Results";

const API_URL = "http://localhost:5000/analyze";
const BACKEND_URL = "http://localhost:5000";

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedName, setUpdatedName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");

  const currentPath = window.location.pathname;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/me`, {
          method: "GET",
          credentials: "include"
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // Upload Profile Photo
  const handlePhotoUpload = async (event) => {
    const selectedPhoto = event.target.files[0];

    if (!selectedPhoto) return;

    setPhotoMessage("");
    setPhotoError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(selectedPhoto.type)) {
      setPhotoError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (selectedPhoto.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be under 2 MB.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("photo", selectedPhoto);

    setPhotoLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/upload-profile-photo`,
        {
          method: "POST",
          credentials: "include",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Photo upload failed.");
      }

      setUser((previousUser) => ({
        ...previousUser,
        profile_photo: data.photo_url
      }));

      setPhotoMessage(
        data.message || "Profile photo updated successfully!"
      );

    } catch (err) {
      console.error("Photo Upload Error:", err);

      setPhotoError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setPhotoLoading(false);
      event.target.value = "";
    }
  };

  // Remove Profile Photo
  const handleRemovePhoto = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove your profile photo?"
    );

    if (!confirmed) return;

    setPhotoLoading(true);
    setPhotoMessage("");
    setPhotoError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/remove-profile-photo`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not remove photo.");
      }

      setUser((previousUser) => ({
        ...previousUser,
        profile_photo: null
      }));

      setPhotoMessage(
        data.message || "Profile photo removed successfully!"
      );

    } catch (err) {
      console.error("Photo Removal Error:", err);

      setPhotoError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setPhotoLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/logout`, {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        setUser(null);
        setFile(null);
        setResult(null);
        setJobDescription("");
        window.location.href = "/login";
      } else {
        setError("Logout failed. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to the backend.");
    }
  };

  // Edit Profile
  const handleEditProfile = () => {
    setUpdatedName(user?.name || "");
    setProfileMessage("");
    setProfileError("");
    setEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setUpdatedName(user?.name || "");
    setProfileMessage("");
    setProfileError("");
  };

  // Save Profile
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const name = updatedName.trim();

    if (!name) {
      setProfileError("Please enter your name.");
      return;
    }

    if (name.length > 100) {
      setProfileError("Name cannot exceed 100 characters.");
      return;
    }

    setProfileLoading(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/update-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ name })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Profile update failed.");
      }

      setUser((previousUser) => ({
        ...previousUser,
        ...data.user
      }));

      setUpdatedName(data.user.name);
      setEditingProfile(false);
      setProfileMessage("Profile updated successfully!");

    } catch (err) {
      console.error("Profile Update Error:", err);

      setProfileError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from current password."
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password change failed.");
      }

      setPasswordMessage(
        data.message || "Password changed successfully!"
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

    } catch (err) {
      console.error("Change Password Error:", err);

      setPasswordError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (currentPath === "/login") {
    return <Login />;
  }

  if (currentPath === "/register") {
    return <Register />;
  }

  if (checkingSession) {
    return <div className="dashboard">Checking login session...</div>;
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // Resume File Selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setError("");
    setResult(null);

    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setFile(null);
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    setFile(selectedFile);
  };

  // Analyze Resume
  const analyzeResume = async () => {
    setError("");
    setResult(null);

    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("resume", file);
      formData.append("job_description", jobDescription);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const data = await response.json();

      console.log("Backend Response:", data);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Resume analysis failed."
        );
      }

      setResult(data);

    } catch (err) {
      console.error("Analysis Error:", err);

      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to Python Backend. Please check if it is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Improvement Suggestions
  const getSuggestions = () => {
    if (!result) return [];

    const suggestions = [];

    const missingSkills = Array.isArray(result.missingSkills)
      ? result.missingSkills
      : [];

    const score = result.matchPercentage ?? result.score;

    if (score === null || score === undefined) {
      suggestions.push(
        "No required skills were detected in the job description. Add clear job requirements and analyze again."
      );
    } else if (score >= 80) {
      suggestions.push(
        "Your resume matches many of the detected job requirements. Keep improving it with relevant achievements."
      );
    } else if (score >= 50) {
      suggestions.push(
        "Your resume has a moderate match. Highlight more relevant skills and experience."
      );
    } else {
      suggestions.push(
        "Your resume needs more alignment with the job description. Review the required skills carefully."
      );
    }

    if (missingSkills.length > 0) {
      suggestions.push(
        `Review these missing skills: ${missingSkills.join(", ")}. If you genuinely have these skills, add them to your resume with relevant examples.`
      );
    } else if (score !== null && score !== undefined) {
      suggestions.push(
        "All detected required skills were found. Make sure your resume includes clear examples of how you used them."
      );
    }

    suggestions.push(
      "Add measurable achievements and project experience to make your resume more informative."
    );

    suggestions.push(
      "Use clear section headings such as Education, Skills, Projects and Experience."
    );

    suggestions.push(
      "Keep your resume well-organized and check spelling and grammar before applying."
    );

    return suggestions;
  };

  // Download PDF Report
  const downloadReport = () => {
    if (!result) return;

    try {
      const pdf = new jsPDF();

      let y = 20;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(40, 70, 150);

      pdf.text("Resume Analysis Report", 20, y);

      y += 15;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);

      const fileName = file?.name || "Resume";

      pdf.text(`Resume: ${fileName}`, 20, y);

      y += 10;

      const score = result.matchPercentage ?? result.score;
      const scoreText = score == null ? "N/A" : `${score}%`;

      pdf.text(`Match Score: ${scoreText}`, 20, y);

      y += 15;

      const addSection = (title, items) => {
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(40, 70, 150);

        pdf.text(title, 20, y);

        y += 9;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);

        const lines = items.length > 0 ? items : ["None detected"];

        lines.forEach((item) => {
          const wrapped = pdf.splitTextToSize(
            "- " + String(item),
            165
          );

          if (y + wrapped.length * 6 > 275) {
            pdf.addPage();
            y = 20;
          }

          pdf.text(wrapped, 22, y);
          y += wrapped.length * 6;
        });

        y += 8;
      };

      addSection("Skills Found", result.foundSkills || []);
      addSection("Missing Skills", result.missingSkills || []);
      addSection("Required Skills", result.requiredSkills || []);
      addSection("Improvement Suggestions", getSuggestions());

      pdf.save("Resume_Analysis_Report.pdf");

    } catch (err) {
      console.error("PDF Download Error:", err);
      setError("Unable to generate PDF report.");
    }
  };

  return (
    <div className="dashboard">

      <nav className="navbar">
        <div className="logo">
          Resume<span>Analyzer</span>
        </div>

        <div className="nav-auth">
          <span className="welcome-user">
            Welcome, {user?.name || user?.email || "User"}
          </span>

          <button
            className="login-btn"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Profile Section */}
      <section className="profile-section">
        <div className="profile-card">

          <div className="profile-photo-area">

            <div className="profile-avatar">
              {user?.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt="Profile"
                  className="profile-photo-image"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            <label className="photo-upload-button">
              {photoLoading
                ? "Please wait..."
                : user?.profile_photo
                  ? "Change Photo"
                  : "Upload Photo"}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                disabled={photoLoading}
                hidden
              />
            </label>

            {user?.profile_photo && (
              <button
                type="button"
                className="remove-photo-button"
                onClick={handleRemovePhoto}
                disabled={photoLoading}
              >
                {photoLoading ? "Please wait..." : "Remove Photo"}
              </button>
            )}

            {photoMessage && (
              <p className="profile-success-message">
                {photoMessage}
              </p>
            )}

            {photoError && (
              <p className="profile-error-message">
                {photoError}
              </p>
            )}

          </div>

          <div className="profile-info">

            <span className="profile-label">MY ACCOUNT</span>

            <h2>{user?.name || "User"}</h2>

            <p>{user?.email || "Email not available"}</p>

            <div className="profile-details">
              <span>User ID: {user?.id || "N/A"}</span>

              <span className="account-status">
                ● Active Account
              </span>
            </div>

            {profileMessage && (
              <p className="profile-success-message">
                {profileMessage}
              </p>
            )}

            {editingProfile ? (
              <form
                className="profile-edit-form"
                onSubmit={handleSaveProfile}
              >
                <label htmlFor="updatedName">
                  Change Your Name
                </label>

                <input
                  id="updatedName"
                  type="text"
                  value={updatedName}
                  onChange={(event) => {
                    setUpdatedName(event.target.value);
                    setProfileError("");
                  }}
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                />

                {profileError && (
                  <p className="profile-error-message">
                    {profileError}
                  </p>
                )}

                <div className="profile-actions">
                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={profileLoading}
                  >
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={handleCancelEdit}
                    disabled={profileLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="edit-profile-button"
                onClick={handleEditProfile}
              >
                Edit Profile
              </button>
            )}

            {passwordMessage && (
              <p className="password-success-message">
                {passwordMessage}
              </p>
            )}

            <button
              type="button"
              className="change-password-button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setPasswordError("");
                setPasswordMessage("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              {showPasswordForm
                ? "Cancel Password Change"
                : "Change Password"}
            </button>

            {showPasswordForm && (
              <form
                className="change-password-form"
                onSubmit={handleChangePassword}
              >
                <label htmlFor="currentPassword">
                  Current Password
                </label>

                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />

                <label htmlFor="newPassword">
                  New Password
                </label>

                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordError("");
                  }}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <label htmlFor="confirmPassword">
                  Confirm New Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                {passwordError && (
                  <p className="password-error-message" role="alert">
                    {passwordError}
                  </p>
                )}

                <button
                  type="submit"
                  className="password-save-button"
                  disabled={passwordLoading}
                >
                  {passwordLoading
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </form>
            )}

          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero">
        <h1>Analyze Your Resume with AI</h1>

        <p>
          Discover your skills, identify missing keywords,
          and improve your resume for your dream job.
        </p>

        <a href="#analyzer" className="get-started">
          Get Started
        </a>
      </section>

      {/* Resume Analyzer Section */}
      <main id="analyzer" className="analyzer-dashboard">

        <div className="dashboard-heading">
          <span className="eyebrow">
            AI POWERED CAREER ASSISTANT
          </span>

          <h2>Resume Analyzer</h2>

          <p>
            Upload your resume and enter a job description
            to analyze your career profile.
          </p>
        </div>

        <div className="analyzer-grid">

          <div className="upload-box">
            <div className="upload-icon">📄</div>

            <h3>Upload Your Resume</h3>

            <p>Choose your PDF or DOCX resume.</p>

            <label className="upload-button">
              Choose Resume

              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                hidden
              />
            </label>

            {file && (
              <p className="selected-file">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="job-box">
            <h3>Job Description</h3>

            <p>Paste the job requirements below.</p>

            <textarea
              placeholder="Enter job description here..."
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setError("");
              }}
            />
          </div>

        </div>

        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}

        <button
          className="analyze-button"
          type="button"
          onClick={analyzeResume}
          disabled={loading}
        >
          {loading ? "Analyzing Resume..." : "Analyze Resume"}
        </button>

        {loading && (
          <p className="loading-message">
            Please wait. Your resume is being analyzed...
          </p>
        )}

        {result && (
          <div className="results-area">
            <h2>Analysis Results</h2>

            <Results result={result} />

            <div className="suggestions-section">
              <div className="suggestions-heading">
                <span>CAREER GUIDANCE</span>

                <h2>Improvement Suggestions</h2>

                <p>
                  Recommendations based on your resume analysis.
                </p>
              </div>

              <div className="suggestions-list">
                {getSuggestions().map((suggestion, index) => (
                  <div className="suggestion-card" key={index}>
                    <div className="suggestion-number">
                      {index + 1}
                    </div>

                    <p>{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="download-button"
              type="button"
              onClick={downloadReport}
            >
              📥 Download PDF Report
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
