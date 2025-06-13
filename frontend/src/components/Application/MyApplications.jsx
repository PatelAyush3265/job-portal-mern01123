import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";
import ATSScoreChart from "./ATSScoreChart";
import "./MyApplications.css";

const MyApplications = () => {
  const { user } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showChart, setShowChart] = useState(false);

  const { isAuthorized } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && user.role === "Employer") {
          if (selectedJob) {
            const { data } = await axios.get(
              `http://localhost:4000/api/v1/application/job/${selectedJob._id}`,
              {
                withCredentials: true,
              }
            );
            setApplications(data.applications);
          } else {
            const { data } = await axios.get(
              "http://localhost:4000/api/v1/job/getmyjobs",
              {
                withCredentials: true,
              }
            );
            setMyJobs(data.myJobs);
          }
        } else {
          const { data } = await axios.get(
            "http://localhost:4000/api/v1/application/myapplications",
            {
              withCredentials: true,
            }
          );
          setApplications(data.myApplications);
        }
      } catch (error) {
        toast.error(error.response.data.message);
        if (user && user.role === "Employer" && !selectedJob) {
          setMyJobs([]);
        } else {
          setApplications([]);
        }
      }
    };
    fetchData();
  }, [isAuthorized, user, selectedJob]);

  if (!isAuthorized) {
    navigateTo("/");
  }

  const deleteApplication = (id) => {
    try {
      axios
        .delete(`http://localhost:4000/api/v1/application/delete/${id}`, {
          withCredentials: true,
        })
        .then((res) => {
          toast.success(res.data.message);
          setApplications((prevApplications) =>
            prevApplications.filter((application) => application._id !== id)
          );
        });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const openModal = (url) => {
    setResumeUrl(url);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setApplications([]);
    setShowChart(false);
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
    setApplications([]);
    setShowChart(false);
  };

  const handleViewChart = () => {
    setShowChart(true);
  };

  const handleBackToApplications = () => {
    setShowChart(false);
  };

  return (
    <section className="my_applications page">
      {user && user.role === "Job Seeker" ? (
        <div className="container">
          <center>
            <h1>My Applications</h1>
          </center>
          {applications.length <= 0 ? (
            <>
              <center>
                <h4>No Applications Found</h4>
              </center>
            </>
          ) : (
            applications.map((element) => {
              return (
                <JobSeekerCard
                  element={element}
                  key={element._id}
                  deleteApplication={deleteApplication}
                  openModal={openModal}
                />
              );
            })
          )}
        </div>
      ) : (
        <div className="container">
          <center>
            <h1>{selectedJob ? (showChart ? `ATS Scores for ${selectedJob.title}` : `Applications for ${selectedJob.title}`) : "Your Posted Jobs"}</h1>
            {(selectedJob && !showChart) && (
              <button onClick={handleBackToJobs} className="back-button">
                Back to All Jobs
              </button>
            )}
            {showChart && (
              <button onClick={handleBackToApplications} className="back-button">
                Back to Applications
              </button>
            )}
          </center>
          {!selectedJob ? (
            myJobs.length <= 0 ? (
              <center>
                <h4>No Jobs Posted Yet</h4>
              </center>
            ) : (
              <div className="job_cards_container">
                {myJobs.map((job) => (
                  <PostedJobCard key={job._id} job={job} onClick={handleJobClick} />
                ))}
              </div>
            )
          ) : showChart ? (
            <ATSScoreChart jobId={selectedJob._id} />
          ) : applications.length <= 0 ? (
            <center>
              <h4>No Applications Found for this Job</h4>
            </center>
          ) : (
            <div className="applications_list">
              <button onClick={handleViewChart} className="view-chart-button">
                View ATS Score Chart
              </button>
              {applications.map((element) => (
                <EmployerCard
                  element={element}
                  key={element._id}
                  openModal={openModal}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {modalOpen && (
        <ResumeModal url={resumeUrl} onClose={closeModal} />
      )}
    </section>
  );
};

export default MyApplications;

const JobSeekerCard = ({ element, deleteApplication, openModal }) => {
  return (
    <>
      <div className="job_seeker_card">
        <div className="detail">
          <p>
            <span>Job Title:</span> {element.jobID.title}
          </p>
          <p>
            <span>Company:</span> {element.employerID.user.name}
          </p>
          <p>
            <span>ATS Score:</span> {element.atsScore}%
          </p>
          <p>
            <span>Name:</span> {element.name}
          </p>
          <p>
            <span>Email:</span> {element.email}
          </p>
          <p>
            <span>Phone:</span> {element.phone}
          </p>
          <p>
            <span>Address:</span> {element.address}
          </p>
          <p>
            <span>CoverLetter:</span> {element.coverLetter}
          </p>
          <p>
            <span>Status:</span> {element.status}
          </p>
        </div>
        <div className="resume">
          <button 
            onClick={() => openModal(element.resume.url)}
            className="view-resume-btn"
          >
            View Resume
          </button>
        </div>
        <div className="btn_area">
          <button onClick={() => deleteApplication(element._id)}>
            Delete Application
          </button>
        </div>
      </div>
    </>
  );
};

const PostedJobCard = ({ job, onClick }) => {
  return (
    <div className="posted_job_card" onClick={() => onClick(job)}>
      <h3>{job.title}</h3>
      <p>Category: {job.category}</p>
      <p>Location: {job.city}, {job.country}</p>
      <p>Posted On: {new Date(job.jobPostedOn).toLocaleDateString()}</p>
      <button className="view-applications-btn">View Applications</button>
    </div>
  );
};

const EmployerCard = ({ element, openModal /*, deleteApplication */ }) => {
  const getAtsScoreColor = (score) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 50) return "#FFC107";
    return "#F44336";
  };

  return (
    <>
      <div className="job_seeker_card">
        <div className="detail">
          <p>
            <span>Applicant Name:</span> {element.name}
          </p>
          <p>
            <span>Email:</span> {element.email}
          </p>
          <p>
            <span>Phone:</span> {element.phone}
          </p>
          <p>
            <span>Address:</span> {element.address}
          </p>
          <p>
            <span>CoverLetter:</span> {element.coverLetter}
          </p>
          <p>
            <span>Status:</span> {element.status}
          </p>
          <p>
            <span>ATS Score:</span> 
            <span style={{ 
              color: getAtsScoreColor(element.atsScore),
              fontWeight: "bold",
              fontSize: "1.1em"
            }}>
              {element.atsScore}%
            </span>
          </p>
        </div>
        <div className="resume">
          <button 
            onClick={() => openModal(element.resume.url)}
            className="view-resume-btn"
          >
            View Resume
          </button>
        </div>
      </div>
    </>
  );
};
