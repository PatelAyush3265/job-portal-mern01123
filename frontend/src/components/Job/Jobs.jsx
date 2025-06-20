import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import "./Jobs.css";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const { isAuthorized } = useContext(Context);
  const navigateTo = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    try {
      axios
        .get("http://localhost:4000/api/v1/job/getall", {
          withCredentials: true,
        })
        .then((res) => {
          setJobs(res.data);
        });
    } catch (error) {
      console.log(error);
    }
  }, []);

  if (!isAuthorized) {
    navigateTo("/");
  }

  function highlightMatch(text, search) {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'ig');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} style={{ background: '#ffe066', color: '#222', padding: 0 }}>{part}</mark> : part
    );
  }

  const filteredJobs = jobs.jobs
    ? jobs.jobs.filter((job) => {
        const searchLower = search.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(searchLower);
        const matchesCompany = job.companyName && job.companyName.toLowerCase().includes(searchLower);
        const matchesCategory = job.category && job.category.toLowerCase().includes(searchLower);
        const matchesType = typeFilter ? job.jobType === typeFilter : true;
        return (matchesTitle || matchesCompany || matchesCategory) && matchesType;
      })
    : [];

  return (
    <section className="jobs page">
      <div className="container">
        <h1>ALL AVAILABLE JOBS</h1>
        <div className="job-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by job title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="job-search-bar"
            style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #ccc', minWidth: '220px', fontSize: '1rem' }}
          />
          <button
            className={`job-type-btn ${typeFilter === '' ? 'active' : ''}`}
            style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', border: 'none', background: typeFilter === '' ? '#1abc9c' : '#eee', color: typeFilter === '' ? '#fff' : '#333', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            onClick={() => setTypeFilter("")}
          >
            All
          </button>
          <button
            className={`job-type-btn ${typeFilter === 'Full Time' ? 'active' : ''}`}
            style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', border: 'none', background: typeFilter === 'Full Time' ? '#1abc9c' : '#eee', color: typeFilter === 'Full Time' ? '#fff' : '#333', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            onClick={() => setTypeFilter('Full Time')}
          >
            Full Time
          </button>
          <button
            className={`job-type-btn ${typeFilter === 'Part Time' ? 'active' : ''}`}
            style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', border: 'none', background: typeFilter === 'Part Time' ? '#1abc9c' : '#eee', color: typeFilter === 'Part Time' ? '#fff' : '#333', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            onClick={() => setTypeFilter('Part Time')}
          >
            Part Time
          </button>
        </div>
        <div className="banner">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((element) => {
              return (
                <div className="card" key={element._id}>
                  <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>{highlightMatch(element.title, search)}</p>
                  <p style={{ color: '#888', fontWeight: 500 }}>{highlightMatch(element.category || '', search)}</p>
                  <p>{element.country}</p>
                  <p style={{ color: '#1abc9c', fontWeight: 600 }}>{element.jobType}</p>
                  <p style={{ color: '#555', fontWeight: 500, margin: 0 }}>{highlightMatch(element.companyName || '', search)}</p>
                  <Link to={`/job/${element._id}`} className="job-details-link">Job Details</Link>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#888', fontSize: '1.1rem', marginTop: '2rem' }}>No jobs found.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Jobs;
