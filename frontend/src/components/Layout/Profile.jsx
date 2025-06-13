import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const { user, isAuthorized } = useContext(Context);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [postedJobs, setPostedJobs] = useState([]);
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthorized) {
      navigateTo("/");
    }
  }, [isAuthorized, navigateTo]);

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
          <img
            src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740"
            alt="Profile Avatar"
            className="profile-avatar"
          />
          <h1 className="profile-title">{user.name}'s Profile</h1>
        </div>

        <div className="profile-details">
          <h2>Personal Details</h2>
          <p>
            <span>Name:</span> {user.name}
          </p>
          <p>
            <span>Email:</span> {user.email}
          </p>
          <p>
            <span>Phone:</span> {user.phone}
          </p>
          <p>
            <span>Role:</span> {user.role}
          </p>
        </div>

        {user.role === "Job Seeker" && (
          <div className="job-info">
            <h2>My Applications ({appliedJobs.length})</h2>
            {appliedJobs.length > 0 ? (
              <div className="job-list">
                {appliedJobs.map((application) => (
                  <div key={application._id} className="job-item">
                    <h3>{application.jobID.title}</h3>
                    <p>
                      <span>Company:</span> {application.employerID.user.name}
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