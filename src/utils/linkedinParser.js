export const linkedinParser = {
  parseProfile(htmlContent) {
    // This is a simplified parser - in production, you'd use a proper HTML parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const profile = {
      personal: {},
      experience: [],
      education: [],
      skills: []
    };

    try {
      // Parse name
      const nameElement = doc.querySelector('.text-heading-xlarge');
      if (nameElement) {
        profile.personal.fullName = nameElement.textContent.trim();
      }

      // Parse headline
      const headlineElement = doc.querySelector('.text-body-medium');
      if (headlineElement) {
        profile.personal.title = headlineElement.textContent.trim();
      }

      // Parse location
      const locationElement = doc.querySelector('.text-body-small.inline.t-black--light');
      if (locationElement) {
        profile.personal.location = locationElement.textContent.trim();
      }

      // Parse experience
      const experienceSection = doc.querySelector('#experience-section');
      if (experienceSection) {
        const expItems = experienceSection.querySelectorAll('.pv-entity__position-group');
        expItems.forEach(item => {
          const title = item.querySelector('.pv-entity__summary-info h3')?.textContent.trim();
          const company = item.querySelector('.pv-entity__secondary-title')?.textContent.trim();
          const dateRange = item.querySelector('.pv-entity__date-range span:nth-child(2)')?.textContent.trim();
          
          if (title && company) {
            profile.experience.push({
              title,
              company,
              dateRange,
              description: ''
            });
          }
        });
      }

      // Parse education
      const educationSection = doc.querySelector('#education-section');
      if (educationSection) {
        const eduItems = educationSection.querySelectorAll('.pv-education-entity');
        eduItems.forEach(item => {
          const school = item.querySelector('.pv-entity__school-name')?.textContent.trim();
          const degree = item.querySelector('.pv-entity__degree-name span:nth-child(2)')?.textContent.trim();
          const field = item.querySelector('.pv-entity__fos span:nth-child(2)')?.textContent.trim();
          
          if (school) {
            profile.education.push({
              institution: school,
              degree: degree || '',
              field: field || ''
            });
          }
        });
      }

      // Parse skills
      const skillsSection = doc.querySelector('#skills-section');
      if (skillsSection) {
        const skillItems = skillsSection.querySelectorAll('.pv-skill-category-entity__name-text');
        skillItems.forEach(item => {
          const skill = item.textContent.trim();
          if (skill) {
            profile.skills.push(skill);
          }
        });
      }

    } catch (error) {
      console.error('Error parsing LinkedIn profile:', error);
    }

    return profile;
  },

  async importFromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      // Map LinkedIn JSON export to our format
      return {
        personal: {
          fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          title: data.headline || '',
          location: data.location?.name || '',
          summary: data.summary || '',
          email: data.email || '',
          phone: data.phoneNumbers?.[0]?.number || ''
        },
        experience: (data.positions || []).map(pos => ({
          title: pos.title || '',
          company: pos.company?.name || '',
          startDate: pos.startDate ? `${pos.startDate.year}-${pos.startDate.month}` : '',
          endDate: pos.endDate ? `${pos.endDate.year}-${pos.endDate.month}` : '',
          description: pos.description || ''
        })),
        education: (data.education || []).map(edu => ({
          institution: edu.schoolName || '',
          degree: edu.degree || '',
          field: edu.fieldOfStudy || '',
          startDate: edu.startDate?.year || '',
          endDate: edu.endDate?.year || ''
        })),
        skills: (data.skills || []).map(skill => skill.name || skill)
      };
    } catch (error) {
      console.error('Error importing JSON:', error);
      throw new Error('Invalid JSON format');
    }
  }
};

export default linkedinParser;