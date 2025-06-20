import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { Context } from "../../main";
import { useNavigate } from "react-router-dom";
import "./MyJobs.css";

const MyJobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [editingMode, setEditingMode] = useState(null);
  const { isAuthorized, user } = useContext(Context);

  const navigateTo = useNavigate();
  //Fetching all jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/job/getmyjobs",
          { withCredentials: true }
        );
        setMyJobs(data.myJobs);
      } catch (error) {
        toast.error(error.response.data.message);
        setMyJobs([]);
      }
    };
    fetchJobs();
  }, []);
  if (!isAuthorized || (user && user.role !== "Employer")) {
    navigateTo("/");
  }

  //Function For Enabling Editing Mode
  const handleEnableEdit = (jobId) => {
    //Here We Are Giving Id in setEditingMode because We want to enable only that job whose ID has been send.
    setEditingMode(jobId);
  };

  //Function For Disabling Editing Mode
  const handleDisableEdit = () => {
    setEditingMode(null);
  };

  //Function For Updating The Job
  const handleUpdateJob = async (jobId) => {
    const updatedJob = myJobs.find((job) => job._id === jobId);
    await axios
      .put(`http://localhost:4000/api/v1/job/update/${jobId}`, updatedJob, {
        withCredentials: true,
      })
      .then((res) => {
        toast.success(res.data.message);
        setEditingMode(null);
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  //Function For Deleting Job
  const handleDeleteJob = async (jobId) => {
    await axios
      .delete(`http://localhost:4000/api/v1/job/delete/${jobId}`, {
        withCredentials: true,
      })
      .then((res) => {
        toast.success(res.data.message);
        setMyJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  const handleInputChange = (jobId, field, value) => {
    // Update the job object in the jobs state with the new value
    setMyJobs((prevJobs) =>
      prevJobs.map((job) =>
        job._id === jobId ? { ...job, [field]: value } : job
      )
    );
  };

  return (
    <>
      <div className="myJobs page">
        <div className="container">
          <h1>Your Posted Jobs</h1>
          {myJobs.length > 0 ? (
            <div className="job_listings_page">
              <div className="job_listings_container">
                {myJobs.map((element) => (
                  <div className="job_card" key={element._id}>
                    <div className="job_details">
                      <div className="detail_item">
                        <span className="detail_label">Title:</span>
                        <input
                          type="text"
                          disabled={
                            editingMode !== element._id ? true : false
                          }
                          value={element.title}
                          onChange={(e) =>
                            handleInputChange(
                              element._id,
                              "title",
                              e.target.value
                            )
                          }
                          className="detail_input"
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Country:</span>
                        <input
                          type="text"
                          disabled={
                            editingMode !== element._id ? true : false
                          }
                          value={element.country}
                          onChange={(e) =>
                            handleInputChange(
                              element._id,
                              "country",
                              e.target.value
                            )
                          }
                          className="detail_input"
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">City:</span>
                        <input
                          type="text"
                          disabled={
                            editingMode !== element._id ? true : false
                          }
                          value={element.city}
                          onChange={(e) =>
                            handleInputChange(
                              element._id,
                              "city",
                              e.target.value
                            )
                          }
                          className="detail_input"
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Category:</span>
                        <select
                          value={element.category}
                          onChange={(e) =>
                            handleInputChange(
                              element._id,
                              "category",
                              e.target.value
                            )
                          }
                          disabled={
                            editingMode !== element._id ? true : false
                          }
                          className="detail_select"
                        >
                          <option value="Graphics & Design">
                            Graphics & Design
                          </option>
                          <option value="Mobile App Development">
                            Mobile App Development
                          </option>
                          <option value="Frontend Web Development">
                            Frontend Web Development
                          </option>
                          <option value="MERN Stack Development">
                            MERN STACK Development
                          </option>
                          <option value="Account & Finance">
                            Account & Finance
                          </option>
                          <option value="Artificial Intelligence">
                            Artificial Intelligence
                          </option>
                          <option value="Video Animation">
                            Video Animation
                          </option>
                          <option value="MEAN Stack Development">
                            MEAN STACK Development
                          </option>
                          <option value="MEVN Stack Development">
                            MEVN STACK Development
                          </option>
                          <option value="Data Entry Operator">
                            Data Entry Operator
                          </option>
                        </select>
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">
                          Salary:{" "}
                        </span>
                        {element.fixedSalary ? (
                          <input
                            type="number"
                            disabled={
                              editingMode !== element._id ? true : false
                            }
                            value={element.fixedSalary}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "fixedSalary",
                                e.target.value
                              )
                            }
                            className="detail_input"
                          />
                        ) : (
                          <div className="salary_range_inputs">
                            <input
                              type="number"
                              disabled={
                                editingMode !== element._id ? true : false
                              }
                              value={element.salaryFrom}
                              onChange={(e) =>
                                handleInputChange(
                                  element._id,
                                  "salaryFrom",
                                  e.target.value
                                )
                              }
                              className="detail_input"
                            />
                            <input
                              type="number"
                              disabled={
                                editingMode !== element._id ? true : false
                              }
                              value={element.salaryTo}
                              onChange={(e) =>
                                handleInputChange(
                                  element._id,
                                  "salaryTo",
                                  e.target.value
                                )
                              }
                              className="detail_input"
                            />
                          </div>
                        )}
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Expired:</span>
                        <select
                          value={element.expired}
                          onChange={(e) =>
                            handleInputChange(
                              element._id,
                              "expired",
                              e.target.value
                            )
                          }
                          disabled={
                            editingMode !== element._id ? true : false
                          }
                          className="detail_select"
                        >
                          <option value={true}>YES</option>
                          <option value={false}>NO</option>
                        </select>
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Company Name:</span>
                        <input
                          type="text"
                          disabled={editingMode !== element._id}
                          value={element.companyName || ""}
                          onChange={e => handleInputChange(element._id, "companyName", e.target.value)}
                          className="detail_input"
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Job Type:</span>
                        <select
                          value={element.jobType || ""}
                          onChange={e => handleInputChange(element._id, "jobType", e.target.value)}
                          disabled={editingMode !== element._id}
                          className="detail_select"
                        >
                          <option value="">Select Job Type</option>
                          <option value="Full Time">Full Time</option>
                          <option value="Part Time">Part Time</option>
                        </select>
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Location:</span>
                        <input
                          type="text"
                          disabled={editingMode !== element._id}
                          value={element.location || ""}
                          onChange={e => handleInputChange(element._id, "location", e.target.value)}
                          className="detail_input"
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Description:</span>
                        <textarea
                          disabled={editingMode !== element._id}
                          value={element.description || ""}
                          onChange={e => handleInputChange(element._id, "description", e.target.value)}
                          className="detail_input"
                          rows={3}
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Job Start Time:</span>
                        <input
                          type="time"
                          disabled={editingMode !== element._id}
                          value={element.duration?.start || ""}
                          onChange={e => handleInputChange(element._id, "duration", { ...element.duration, start: e.target.value })}
                          className="detail_input"
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Job End Time:</span>
                        <input
                          type="time"
                          disabled={editingMode !== element._id}
                          value={element.duration?.end || ""}
                          onChange={e => handleInputChange(element._id, "duration", { ...element.duration, end: e.target.value })}
                          className="detail_input"
                        />
                      </div>
                    </div>

                    <div className="full_width_details">
                      <div className="detail_item">
                        <span className="detail_label">Description:</span>
                        <textarea
                          rows="10"
                          disabled={
                            editingMode !== element._id ? true : false
                          }
                          value={element.description}
                          onChange={(e) =>
                            handleInputChange(
                              element._id,
                              "description",
                              e.target.value
                            )
                          }
                          className="detail_textarea"
                        />
                      </div>
                      <div className="detail_item">
                        <span className="detail_label">Location:</span>
                        <textarea
                          rows="5"
                          disabled={
                            editingMode !== element._id ? true : false
                          }
                          value={element.location}
                          onChange={(e) =>
                            handleInputChange(
                              element._id,
                              "location",
                              e.target.value
                            )
                          }
                          className="detail_textarea"
                        />
                      </div>
                    </div>

                    <div className="actions">
                      {editingMode === element._id ? (
                        <div className="edit_buttons">
                          <button
                            onClick={() => handleUpdateJob(element._id)}
                            className="save_btn"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleDisableEdit()}
                            className="cancel_btn"
                          >
                            <RxCross2 />
                          </button>
                        </div>
                      ) : (
                        <div className="action_buttons">
                          <button
                            onClick={() => handleEnableEdit(element._id)}
                            className="edit_btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteJob(element._id)}
                            className="delete_btn"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="no_jobs_message">You haven't posted any job yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default MyJobs;
