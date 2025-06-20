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
  const [shortlist, setShortlist] = useState([]);
  const [showShortlist, setShowShortlist] = useState(false);

  const { isAuthorized } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      if (user.role === "Employer") {
        if (selectedJob) {
          const { data } = await axios.get(
            `http://localhost:4000/api/v1/application/job/${selectedJob._id}`,
            { withCredentials: true }
          );
          setApplications(data.applications);
          // Fetch shortlist for this job
          const jobRes = await axios.get(`http://localhost:4000/api/v1/job/${selectedJob._id}`, { withCredentials: true });
          setShortlist(jobRes.data.job.shortlisted || []);
        } else {
          const { data } = await axios.get(
            "http://localhost:4000/api/v1/job/getmyjobs",
            { withCredentials: true }
          );
          setMyJobs(data.myJobs);
        }
      } else if (user.role === "Job Seeker") {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/application/myapplications",
          { withCredentials: true }
        );
        setApplications(data.myApplications);
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

  const handleShortlist = async (jobId, jobSeekerId, applicationId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/v1/job/${jobId}/shortlist`,
        { jobSeekerId, applicationId },
        { withCredentials: true }
      );
      toast.success("Shortlisted!");
      // Refresh shortlist
      const jobRes = await axios.get(`http://localhost:4000/api/v1/job/${jobId}`, { withCredentials: true });
      setShortlist(jobRes.data.job.shortlisted || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error shortlisting");
    }
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
            applications
              .filter((element) => element.jobID)
              .map((element) => {
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
      ) : user && user.role === "Employer" ? (
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
            {selectedJob && !showChart && (
              <button onClick={() => setShowShortlist(true)} className="show-shortlist-btn" style={{marginRight:'1rem',marginBottom:'1rem',background:'#1abc9c',color:'#fff',padding:'0.6rem 1.2rem',borderRadius:'8px',fontWeight:600}}>Show List</button>
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
                  selectedJob={selectedJob}
                  shortlist={shortlist}
                  handleShortlist={handleShortlist}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
      {modalOpen && (
        <ResumeModal url={resumeUrl} onClose={closeModal} />
      )}
      {showShortlist && (
        <ShortlistModal
          shortlist={shortlist}
          onClose={() => setShowShortlist(false)}
          jobId={selectedJob?._id}
        />
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
            <span>Job Title:</span> {element.jobID ? element.jobID.title : "N/A"}
          </p>
          <p>
            <span>Company:</span> {element.employerID && element.employerID.user ? element.employerID.user.name : "N/A"}
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

const EmployerCard = ({ element, openModal, selectedJob, shortlist, handleShortlist }) => {
  const getAtsScoreColor = (score) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 50) return "#FFC107";
    return "#F44336";
  };
  const isShortlisted = shortlist.some(
    (entry) =>
      entry.jobSeeker === element.applicantID.user._id &&
      entry.applicationId === element._id
  );
  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p><span>Applicant Name:</span> {element.name}</p>
        <p><span>Email:</span> {element.email}</p>
        <p><span>Phone:</span> {element.phone}</p>
        <p><span>Address:</span> {element.address}</p>
        <p><span>CoverLetter:</span> {element.coverLetter}</p>
        <p><span>Status:</span> {element.status}</p>
        <p><span>ATS Score:</span> <span style={{ color: getAtsScoreColor(element.atsScore), fontWeight: "bold", fontSize: "1.1em" }}>{element.atsScore}%</span></p>
      </div>
      <div className="resume">
        <button onClick={() => openModal(element.resume.url)} className="view-resume-btn">View Resume</button>
      </div>
      <div className="btn_area">
        <button
          onClick={() => handleShortlist(selectedJob._id, element.applicantID.user._id, element._id)}
          disabled={isShortlisted}
          style={{ background: isShortlisted ? '#aaa' : '#1abc9c', color: '#fff', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 600, cursor: isShortlisted ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
        >
          {isShortlisted ? 'Shortlisted' : 'Add to List'}
        </button>
      </div>
    </div>
  );
};

const ShortlistModal = ({ shortlist, onClose, jobId }) => {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/v1/job/${jobId}/shortlisted`, { withCredentials: true });
        setDetails(res.data.shortlisted);
      } catch (e) { setDetails([]); }
    };
    fetchDetails();
  }, [jobId, shortlist, loading]);

  const handleRemove = async (applicationId) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:4000/api/v1/job/${jobId}/shortlisted/${applicationId}`, { withCredentials: true });
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="shortlist-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', minWidth: '350px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '2rem' }}>Shortlisted Applicants</h2>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 30, background: '#1abc9c', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.3rem 1rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
        {details.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No shortlisted applicants.</p> : details.map(entry => (
          <div key={entry._id} className="shortlist-card" style={{ border: '1px solid #eee', borderRadius: '12px', marginBottom: '1.5rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ color: '#1abc9c', marginBottom: '0.5rem' }}>{entry.jobSeeker?.name || 'N/A'}</h3>
            <p><b>Email:</b> {entry.jobSeeker?.email || 'N/A'}</p>
            <p><b>Phone:</b> {entry.jobSeeker?.phone || 'N/A'}</p>
            <p><b>Education:</b> {entry.jobSeeker?.education || 'N/A'}</p>
            <p><b>Skills:</b> {entry.jobSeeker?.skills && entry.jobSeeker.skills.length > 0 ? entry.jobSeeker.skills.join(", ") : 'N/A'}</p>
            <p><b>Languages:</b> {entry.jobSeeker?.languages && entry.jobSeeker.languages.length > 0 ? entry.jobSeeker.languages.join(", ") : 'N/A'}</p>
            {entry.jobSeeker?.projects && entry.jobSeeker.projects.length > 0 && (
              <div><b>Projects:</b> <ul style={{ margin: 0, paddingLeft: '1.2em' }}>{entry.jobSeeker.projects.map((p, idx) => <li key={idx}><b>{p.name}:</b> <a href={p.link} target="_blank" rel="noopener noreferrer">{p.link}</a></li>)}</ul></div>
            )}
            <button onClick={() => handleRemove(entry.applicationId)} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 1.2rem', fontWeight: 600, marginTop: '1rem', cursor: 'pointer' }} disabled={loading}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};
