import React, { createContext, useContext, useState, useCallback } from 'react';
import { resumeService } from '../services/resumeService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ResumeContext = createContext();

export const useResumeContext = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResumeContext must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider = ({ children }) => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchResumes = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userResumes = await resumeService.getUserResumes(user.uid);
      setResumes(userResumes);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createResume = async (data) => {
    try {
      const newResume = await resumeService.createResume(user.uid, data);
      setResumes(prev => [newResume, ...prev]);
      toast.success('Resume created successfully');
      return newResume;
    } catch (error) {
      console.error('Error creating resume:', error);
      toast.error('Failed to create resume');
      throw error;
    }
  };

  const updateResume = async (resumeId, data) => {
    try {
      await resumeService.updateResume(resumeId, data);
      setResumes(prev => 
        prev.map(r => r.id === resumeId ? { ...r, ...data } : r)
      );
      if (currentResume?.id === resumeId) {
        setCurrentResume(prev => ({ ...prev, ...data }));
      }
      return true;
    } catch (error) {
      console.error('Error updating resume:', error);
      throw error;
    }
  };

  const deleteResume = async (resumeId) => {
    try {
      await resumeService.deleteResume(resumeId);
      setResumes(prev => prev.filter(r => r.id !== resumeId));
      if (currentResume?.id === resumeId) {
        setCurrentResume(null);
      }
      toast.success('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
      throw error;
    }
  };

  const duplicateResume = async (resumeId) => {
    try {
      const duplicated = await resumeService.duplicateResume(resumeId, user.uid);
      setResumes(prev => [duplicated, ...prev]);
      toast.success('Resume duplicated successfully');
      return duplicated;
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
      throw error;
    }
  };

  const value = {
    resumes,
    currentResume,
    loading,
    fetchResumes,
    createResume,
    updateResume,
    deleteResume,
    duplicateResume,
    setCurrentResume
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};