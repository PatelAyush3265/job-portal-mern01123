import React from 'react';
import './ResumeModal.css';

const ResumeModal = ({ url, onClose }) => {
  return (
    <div className="resume-modal-overlay" onClick={onClose}>
      <div className="resume-modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <iframe
          src={url}
          title="Resume PDF"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};

export default ResumeModal;
