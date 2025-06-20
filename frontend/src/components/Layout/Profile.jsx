import React, { useContext, useEffect, useState, useRef } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const { user, setUser, isAuthorized } = useContext(Context);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [postedJobs, setPostedJobs] = useState([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthorized) {
      navigateTo("/");
    } else {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setEducation(user.education || "");
      setSkills(user.skills || []);
      setLanguages(user.languages || []);
      setProjects(user.projects || []);
      setCompanyName(user.companyName || "");
      setCompanyDescription(user.companyDescription || "");
    }
  }, [isAuthorized, navigateTo, user]);

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!profilePic) {
      toast.error("Please select a profile picture.");
      return;
    }
    const formData = new FormData();
    formData.append("profilePicture", profilePic);
    try {
      const { data } = await axios.put(
        "http://localhost:4000/api/v1/user/update/profile-picture",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUser(data.user);
      toast.success(data.message);
      setProfilePic(null);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const { data } = await axios.put(
        "http://localhost:4000/api/v1/user/update/profile",
        {
          name,
          email,
          phone,
          education,
          skills,
          languages,
          projects,
          companyName,
          companyDescription,
        },
        { withCredentials: true }
      );
      setUser(data.user);
      toast.success(data.message);
      setEditing(false);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          if (user.role === "Job Seeker") {
            const { data } = await axios.get(
              "http://localhost:4000/api/v1/application/myapplications",
              { withCredentials: true }
            );
            setAppliedJobs(data.myApplications);
          } else if (user.role === "Employer") {
            const { data } = await axios.get(
              "http://localhost:4000/api/v1/job/getmyjobs",
              { withCredentials: true }
            );
            setPostedJobs(data.myJobs);
          }
        } catch (error) {
          toast.error(error.response.data.message || "Failed to fetch data.");
        }
      }
    };
    fetchData();
  }, [user]);

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <section className="profile-page page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <img
              src={
                user.profilePicture?.url ||
                "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740"
              }
              alt="Profile Avatar"
              className="profile-avatar"
            />
            <button
              className="edit-pic-btn"
              onClick={() => fileInputRef.current.click()}
            >
              Edit
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
          <h1 className="profile-title">{user.name}'s Profile</h1>
          {profilePic && (
            <button className="upload-btn" onClick={handleUpload}>
              Upload Picture
            </button>
          )}
        </div>

        <div className="profile-details">
          <div className="profile-details-header">
            <h2>Personal Details</h2>
            {!editing && (
              <button className="edit-btn" onClick={handleEdit}>
                Edit Profile
              </button>
            )}
          </div>
          {editing ? (
            <div className="profile-edit-form space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {user.role === "Employer" && (
                <>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company Name"
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    placeholder="Company Description"
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </>
              )}
              {user.role === "Job Seeker" && (
                <>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="Education"
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mb-2">
                    <label className="block text-white font-semibold mb-1">Skills:</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add skill"
                        className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => {
                        if(skillInput.trim()){
                          setSkills([...skills, skillInput.trim()]);
                          setSkillInput("");
                        }
                      }}>Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center bg-blue-700 text-white px-3 py-1 rounded-full text-sm">
                          {skill}
                          <button type="button" className="ml-2 text-red-300 hover:text-red-500" onClick={() => setSkills(skills.filter((_, i) => i !== idx))}>&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-white font-semibold mb-1">Languages:</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        placeholder="Add language"
                        className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => {
                        if(languageInput.trim()){
                          setLanguages([...languages, languageInput.trim()]);
                          setLanguageInput("");
                        }
                      }}>Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, idx) => (
                        <span key={idx} className="inline-flex items-center bg-green-700 text-white px-3 py-1 rounded-full text-sm">
                          {lang}
                          <button type="button" className="ml-2 text-red-300 hover:text-red-500" onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}>&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-white font-semibold mb-1">Projects:</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project Name"
                        className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={projectLink}
                        onChange={(e) => setProjectLink(e.target.value)}
                        placeholder="Project Link"
                        className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => {
                        if(projectName.trim() && projectLink.trim()){
                          setProjects([...projects, { name: projectName.trim(), link: projectLink.trim() }]);
                          setProjectName("");
                          setProjectLink("");
                        }
                      }}>Add</button>
                    </div>
                    <div className="space-y-1">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1 rounded">
                          <span className="font-semibold">{proj.name}:</span>
                          <a href={proj.link} target="_blank" rel="noopener noreferrer" className="underline text-blue-300">{proj.link}</a>
                          <button type="button" className="ml-2 text-red-300 hover:text-red-500" onClick={() => setProjects(projects.filter((_, i) => i !== idx))}>&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <button className="save-btn bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleSave}>
                Save
              </button>
              <button className="cancel-btn bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-2" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="profile-info">
              <p>
                <span>Name:</span> {user.name || ""}
              </p>
              <p>
                <span>Email:</span> {user.email || ""}
              </p>
              <p>
                <span>Phone:</span> {user.phone || ""}
              </p>
              <p>
                <span>Role:</span> {user.role || ""}
              </p>
              {user.role === "Employer" && (
                <>
                  <p><span>Company Name:</span> {user.companyName || ""}</p>
                  <p><span>Company Description:</span> {user.companyDescription || ""}</p>
                </>
              )}
              {user.role === "Job Seeker" && (
                <>
                  {user.education && <p><span>Education:</span> {user.education}</p>}
                  {user.skills && user.skills.length > 0 && (
                    <p><span>Skills:</span> {user.skills.join(", ")}</p>
                  )}
                  {user.languages && user.languages.length > 0 && (
                    <p><span>Languages:</span> {user.languages.join(", ")}</p>
                  )}
                  {user.projects && user.projects.length > 0 && (
                    <div>
                      <span>Projects:</span>
                      <ul>
                        {user.projects.map((proj, idx) => (
                          <li key={idx}><span>{proj.name}:</span> <a href={proj.link} target="_blank" rel="noopener noreferrer">{proj.link}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {user.role === "Job Seeker" && (
          <div className="job-info">
            <h2>My Applications ({appliedJobs.length})</h2>
            {appliedJobs.length > 0 ? (
              <div className="job-list">
                {appliedJobs.map((application) => (
                  <div key={application._id} className="job-item">
                    <h3>{application.jobID ? application.jobID.title : "N/A"}</h3>
                    <p>
                      <span>Company:</span> {application.employerID && application.employerID.user ? application.employerID.user.name : "N/A"}
                    </p>
                    <p>
                      <span>Applied On:</span>{" "}
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                    <p>
                      <span>Status:</span> {application.status}
                    </p>
                    <p>
                      <span>ATS Score:</span> {application.atsScore}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No jobs applied yet.</p>
            )}
          </div>
        )}

        {user.role === "Employer" && (
          <div className="job-info">
            <h2>Posted Jobs ({postedJobs.length})</h2>
            {postedJobs.length > 0 ? (
              <div className="job-list">
                {postedJobs.map((job) => (
                  <div key={job._id} className="job-item">
                    <h3>{job.title}</h3>
                    <p>
                      <span>Category:</span> {job.category}
                    </p>
                    <p>
                      <span>Location:</span> {job.city}, {job.country}
                    </p>
                    <p>
                      <span>Posted On:</span>{" "}
                      {new Date(job.jobPostedOn).toLocaleDateString()}
                    </p>
                    <p>
                      <span>Salary:</span>{" "}
                      {job.fixedSalary
                        ? `$${job.fixedSalary}`
                        : `$${job.salaryFrom} - $${job.salaryTo}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No jobs posted yet.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile; 