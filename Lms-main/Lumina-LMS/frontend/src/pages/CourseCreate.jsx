import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoursesAPI } from '../api/client';

export default function CourseCreate() {
  const nav = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', duration: '', content: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await CoursesAPI.create(form);
      nav(`/courses/${data.course?._id || data._id}`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{maxWidth: 640, margin: '24px auto'}}>
        <h2>Create Course</h2>
        {error && <div className="alert danger">{error}</div>}
        <form onSubmit={onSubmit} className="form">
          <label>Title</label>
          <input name="title" value={form.title} onChange={onChange} placeholder="Intro to Programming" required />
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={4} placeholder="What students will learn" />
          <label>Duration</label>
          <input name="duration" value={form.duration} onChange={onChange} placeholder="8 weeks" />
          <label>Content</label>
          <textarea name="content" value={form.content} onChange={onChange} rows={8} placeholder="Syllabus, reading materials, links, and instructions" />
          <button className="btn primary" disabled={loading}>{loading ? 'Creating...' : 'Create Course'}</button>
        </form>
      </div>
    </div>
  );
}
