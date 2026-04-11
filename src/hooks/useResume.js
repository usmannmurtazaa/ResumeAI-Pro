import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useResume = (resumeId) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchResume = useCallback(async () => {
    if (!resumeId || !user) return;
    
    try {
      setLoading(true);
      const docRef = doc(db, 'resumes', resumeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.userId !== user.uid) {
          toast.error('You do not have permission to view this resume');
          navigate('/dashboard');
          return;
        }
        setResume({ id: docSnap.id, ...data });
      } else {
        toast.error('Resume not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
      toast.error('Failed to load resume');
    } finally {
      setLoading(false);
    }
  }, [resumeId, user, navigate]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const saveResume = async (data) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const resumeData = {
        ...data,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
        status: 'draft'
      };

      if (resumeId) {
        const docRef = doc(db, 'resumes', resumeId);
        await updateDoc(docRef, resumeData);
        setResume(prev => ({ ...prev, ...resumeData }));
      } else {
        const docRef = await addDoc(collection(db, 'resumes'), {
          ...resumeData,
          name: data.data?.personal?.fullName || 'Untitled Resume',
          createdAt: new Date().toISOString()
        });
        
        navigate(`/builder/${docRef.id}`, { replace: true });
        setResume({ id: docRef.id, ...resumeData });
      }
      
      return true;
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    resume,
    loading,
    saving,
    saveResume,
    fetchResume
  };
};