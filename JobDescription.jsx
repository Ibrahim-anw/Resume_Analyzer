function JobDescription() {
  return (
    <div className="job-box">
      <h3>Job Description</h3>

      <p>
        Paste the job description you want to compare your resume with.
      </p>

      <textarea
        placeholder="Example: We are looking for a React developer with JavaScript, Python, Git and strong problem-solving skills..."
        rows="10"
      ></textarea>
    </div>
  );
}

export default JobDescription;
