import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const ATSScoreChart = ({ jobId }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!jobId) return;

    axios.get(`http://localhost:4000/api/v1/application/job/${jobId}`, {
      withCredentials: true,
    })
      .then(res => {
        const chartData = res.data.applications.map(app => ({
          name: app.name, // Job Seeker Name
          ats_score: app.atsScore, // ATS Score
        }));
        setData(chartData);
      })                                                                                                                                                                                                                                                                                                                                                                                                                                            
      .catch(err => {
        console.error('Error fetching ATS scores:', err);
        toast.error(err.response?.data?.message || 'Failed to load ATS scores.');
      });                                                                                               
  }, [jobId]);

  return (
    <div className="ats-chart-container">
      <h2 className="chart-title">ATS Score vs Job Seeker Name</h2>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="ats_score" fill="#8884d8" radius={[10, 10, 0, 0]} barSize={80} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="no-data-message">No application data available for this job to generate chart.</p>
      )}
    </div>
  );
};

export default ATSScoreChart; 