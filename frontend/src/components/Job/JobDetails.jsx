import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";
const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState({});
  const navigateTo = useNavigate();

  const { isAuthorized, user } = useContext(Context);

  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/v1/job/${id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setJob(res.data.job);
      })
      .catch((error) => {
        navigateTo("/notfound");
      });
  }, []);

  if (!isAuthorized) {
    navigateTo("/login");
  }

  return (
    <section className="jobDetail page">
      <div className="container">
        <h3>Job Details</h3>
        <div className="banner">
          <p>
            <b>Title:</b> <span>{job.title || ""}</span>
          </p>
          <p>
            <b>Company Name:</b> <span>{job.companyName || ""}</span>
          </p>
          <p>
            <b>Category:</b> <span>{job.category || ""}</span>
          </p>
          <p>
            <b>Job Type:</b> <span>{job.jobType || ""}</span>
          </p>
          <p>
            <b>Job Timing:</b> <span>{job.jobTiming ? `${job.jobTiming.start || ""} - ${job.jobTiming.end || ""}` : ""}</span>
          </p>
          <p>
            <b>Country:</b> <span>{job.country || ""}</span>
          </p>
          <p>
            <b>City:</b> <span>{job.city || ""}</span>
          </p>
          <p>
            <b>Location:</b> <span>{job.location || ""}</span>
          </p>
          <p>
            <b>Skills Required:</b> <span>{job.skills && job.skills.length > 0 ? job.skills.join(", ") : ""}</span>
          </p>
          <p>
            <b>Description:</b> <span>{job.description || ""}</span>
          </p>
        
          <p>
            <b>Salary:</b> {job.fixedSalary ? (
              <span>{job.fixedSalary}</span>
            ) : (
              <span>
                {job.salaryFrom} - {job.salaryTo}
              </span>
            )}
          </p>
          {user && user.role === "Employer" ? (
            <></>
          ) : (
            <Link to={`/application/${job._id}`}>Apply Now</Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobDetails;
