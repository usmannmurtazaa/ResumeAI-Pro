import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiPlus, FiFileText, FiEdit, FiTrash2, FiCopy, FiDownload } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ResumeCard from './ResumeCard';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    avgScore: 0
  });

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'resumes'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const resumesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setResumes(resumesData);
      calculateStats(resumesData);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (resumesData) => {
    const completed = resumesData.filter(r => r.status === 'completed').length;
    const scores = resumesData.map(r => r.atsScore || 0);
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    setStats({
      total: resumesData.length,
      completed,
      inProgress: resumesData.length - completed,
      avgScore
    });
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      await deleteDoc(doc(db, 'resumes', resumeId));
      setResumes(prev => prev.filter(r => r.id !== resumeId));
      toast.success('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };

  const handleDuplicateResume = async (resume) => {
    try {
      const { id, ...resumeData } = resume;
      const newResume = {
        ...resumeData,
        name: `${resume.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft'
      };
      
      const docRef = await addDoc(collection(db, 'resumes'), newResume);
      setResumes(prev => [{ id: docRef.id, ...newResume }, ...prev]);
      toast.success('Resume duplicated successfully');
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">My Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user.displayName || 'User'}!
            </p>
          </div>
          <Button
            onClick={() => navigate('/builder')}
            icon={<FiPlus />}
            className="mt-4 md:mt-0"
          >
            Create New Resume
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Resumes</p>
                <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <h3 className="text-3xl font-bold mt-2">{stats.completed}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <h3 className="text-3xl font-bold mt-2">{stats.inProgress}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
                <FiEdit className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average ATS Score</p>
                <h3 className="text-3xl font-bold mt-2">{stats.avgScore}%</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Resume List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My Resumes</h2>
          
          {resumes.length === 0 ? (
            <Card className="p-12 text-center">
              <FiFileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first professional resume to get started
              </p>
              <Button onClick={() => navigate('/builder')} icon={<FiPlus />}>
                Create Resume
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map(resume => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onEdit={() => navigate(`/builder/${resume.id}`)}
                  onDelete={() => handleDeleteResume(resume.id)}
                  onDuplicate={() => handleDuplicateResume(resume)}
                  onDownload={() => {/* Implement download */}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;