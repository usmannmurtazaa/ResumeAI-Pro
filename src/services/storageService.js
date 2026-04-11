import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from './firebase';

export const storageService = {
  async uploadResumePDF(userId, resumeId, file) {
    const fileRef = ref(storage, `resumes/${userId}/${resumeId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  },

  async uploadProfilePicture(userId, file) {
    const fileRef = ref(storage, `avatars/${userId}/profile_${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  },

  async deleteFile(fileUrl) {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  async getUserResumesFiles(userId) {
    const folderRef = ref(storage, `resumes/${userId}`);
    const result = await listAll(folderRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => ({
        name: itemRef.name,
        url: await getDownloadURL(itemRef)
      }))
    );
    
    return files;
  },

  async getDownloadUrl(path) {
    const fileRef = ref(storage, path);
    return getDownloadURL(fileRef);
  }
};